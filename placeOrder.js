require("dotenv").config();
const { binanceClient } = require("./config");

const totalMarginSize = process.env.TOTAL_MARGIN_SIZE;
const targetLeverage = process.env.TARGET_LEVERAGE;
const LONG_STOP_LOSS = process.env.LONG_STOP_LOSS_PERCENT;
const SHORT_STOP_LOSS = process.env.SHORT_STOP_LOSS_PERCENT;

async function placeOrder(signal) {
  try {
    const orderSide = signal.orderSide.toUpperCase();
    // Fetch market price and instrument details
    const marketPriceData = await binanceClient.futuresPrices({
      symbol: signal.symbol,
    });
    if (!marketPriceData || !marketPriceData[signal.symbol]) {
      return `Failed to get tickers`;
    }

    const symbolPrice = parseFloat(marketPriceData[signal.symbol]);

    // Fetch symbol info to get LOT_SIZE filter
    const symbolInfo = await binanceClient.futuresExchangeInfo();
    const symbolDetails = symbolInfo.symbols.find(
      (s) => s.symbol === signal.symbol
    );

    if (!symbolDetails) {
      console.log(`Symbol details not found for ${signal.symbol}`);
      return `Symbol details not found for ${signal.symbol}`;
    }

    const lotSizeFilter = symbolDetails.filters.find(
      (f) => f.filterType === "LOT_SIZE"
    );
    const minQty = parseFloat(lotSizeFilter.minQty);
    const stepSize = parseFloat(lotSizeFilter.stepSize);

    // Calculate the correct quantity for the target leverage
    const targetNotional = totalMarginSize * targetLeverage;
    let calculatedQuantity = (targetNotional / symbolPrice).toFixed(8);

    // Adjust quantity to match LOT_SIZE filter
    calculatedQuantity = Math.max(
      minQty,
      Math.floor(calculatedQuantity / stepSize) * stepSize
    ).toFixed(8);

    // Check and close opposite position if exists
    const positionInfo = await binanceClient.futuresPositionRisk({
      symbol: signal.symbol,
    });
    console.log("positionInfo:", positionInfo);

    if (positionInfo && positionInfo.length > 0) {
      const position = positionInfo[0];
      if (
        (orderSide === "BUY" && parseFloat(position.positionAmt) > 0) ||
        (orderSide === "SELL" && parseFloat(position.positionAmt) < 0)
      ) {
        console.log(`Position already exists for ${signal.symbol}. `);
        return `Position already exists for ${signal.symbol}`;
      } else if (
        (orderSide === "BUY" && parseFloat(position.positionAmt) < 0) ||
        (orderSide === "SELL" && parseFloat(position.positionAmt) > 0)
      ) {
        let remainingPosition = Math.abs(parseFloat(position.positionAmt));
        while (remainingPosition > 0) {
          const closeOrderParams = {
            symbol: signal.symbol,
            side: orderSide,
            type: "MARKET",
            quantity: remainingPosition,
          };

          const closeResponse = await binanceClient.futuresOrder(
            closeOrderParams
          );

          if (closeResponse.status !== "NEW") {
            console.log(`Close order rejected: ${closeResponse.msg}`);
            return `Close order rejected: ${closeResponse.msg}`;
          }

          // Check remaining position
          const updatedPositionInfo = await binanceClient.futuresPositionRisk({
            symbol: signal.symbol,
          });
          remainingPosition = Math.abs(
            parseFloat(updatedPositionInfo[0].positionAmt)
          );
        }

        // Cancel all open orders for the symbol
        const openOrders = await binanceClient.futuresOpenOrders({
          symbol: signal.symbol,
        });
        for (const order of openOrders) {
          await binanceClient.futuresCancelOrder({
            symbol: signal.symbol,
            orderId: order.orderId,
          });
        }
      }
    }

    // Create order parameters
    const orderParams = {
      symbol: signal.symbol,
      side: orderSide,
      type: "MARKET",
      quantity: calculatedQuantity,
    };

    // Send order request
    const response = await binanceClient.futuresOrder(orderParams);

    if (response.status !== "NEW") {
      console.log(`Order rejected: ${response.msg}`);
      return `Order rejected: ${response.msg}`;
    } else {
      console.log(
        `Market Order placed: ${signal.symbol} ${orderSide}, Quantity: ${calculatedQuantity}`
      );
    }

    try {
      const takeProfitOrders = signal.takeProfits.map((tp) => {
        return {
          symbol: signal.symbol,
          side: orderSide === "BUY" ? "SELL" : "BUY",
          type: "TAKE_PROFIT_MARKET",
          quantity: (
            Math.floor(calculatedQuantity / 4 / stepSize) * stepSize
          ).toFixed(8),
          stopPrice: tp.price,
          reduceOnly: true,
        };
      });

      for (const tpOrder of takeProfitOrders) {
        const tpResponse = await binanceClient.futuresOrder(tpOrder);
        console.log(
          `Take profit order placed: ${tpResponse.ordId} at ${tpOrder.stopPrice}`
        );
      }
    } catch (error) {
      console.log(
        `An error occurred while placing take profit orders: ${error.message}, ${error.stack}`
      );
    }

    // const stopLossPrice =
    //   orderSide === "BUY"
    //     ? (symbolPrice * LONG_STOP_LOSS).toFixed(4)
    //     : (symbolPrice * SHORT_STOP_LOSS).toFixed(4);

    // // Create Stop Loss order
    // const stopLossParams = {
    //   symbol: signal.symbol,
    //   side: orderSide === "BUY" ? "SELL" : "BUY",
    //   type: "STOP_MARKET",
    //   quantity: calculatedQuantity,
    //   stopPrice: stopLossPrice,
    //   reduceOnly: true,
    // };

    // try {
    //   const stopLossResponse = await binanceClient.futuresOrder(stopLossParams);
    //   if (!stopLossResponse || stopLossResponse.status !== "NEW") {
    //     console.log(`Stop Loss rejected: ${stopLossResponse.msg}`);
    //   } else {
    //     console.log(`Stop Loss set for ${signal.symbol} at ${stopLossPrice}`);
    //   }
    // } catch (error) {
    //   console.log(
    //     `An error occurred while placing the stop loss order: ${error.message}, ${error.stack}`
    //   );
    // }
  } catch (error) {
    console.log(
      `An error occurred while placing the order: ${error.message}, ${error.stack}`
    );
    return `An error occurred while placing the order: ${error.message}, ${error.stack}`;
  }
}

module.exports = placeOrder;
