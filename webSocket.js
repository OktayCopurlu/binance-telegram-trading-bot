// //WebSocket client for order updates
// binanceClient.ws.futuresUser(async (data) => {
//   if (data.eventType === "ORDER_TRADE_UPDATE") {
//     const orderData = data.order;
//     const orderStatus = orderData.orderStatus;

//     if (orderStatus === "FILLED" && orderData.type === "TAKE_PROFIT_MARKET") {
//       // Cancel existing Stop Loss order if any
//       const existingOrders = await binanceClient.futuresOpenOrders({
//         symbol: orderData.symbol,
//       });

//       for (const order of existingOrders) {
//         if (order.type === "STOP_MARKET") {
//           const cancelResponse = await binanceClient.futuresCancelOrder({
//             symbol: orderData.symbol,
//             orderId: order.orderId,
//           });

//           if (!cancelResponse || cancelResponse.status !== "CANCELED") {
//             console.error(
//               `Failed to cancel existing Stop Loss order: ${cancelResponse.msg}`
//             );
//           } else {
//             console.log(`Existing Stop Loss order ${order.orderId} cancelled.`);
//           }
//         }
//       }

//       // Calculate Stop Loss price
//       const symbolPrice = orderData.avgPrice;
//       const side = orderData.side;
//       const stopLossPrice =
//         side === "SELL"
//           ? (symbolPrice * 0.981).toFixed(4)
//           : (symbolPrice * 1.019).toFixed(4);

//       // Create Stop Loss order
//       const stopLossResponse = await binanceClient.futuresOrder({
//         symbol: orderData.symbol,
//         side: side === "SELL" ? "BUY" : "SELL",
//         type: "STOP_MARKET",
//         quantity: orderData.origQty,
//         stopPrice: stopLossPrice,
//         reduceOnly: true,
//       });

//       if (!stopLossResponse || stopLossResponse.status !== "NEW") {
//         return `Stop Loss rejected: ${stopLossResponse.msg}`;
//       } else {
//         return `Stop Loss set for ${orderData.symbol} at ${stopLossPrice}`;
//       }
//     }
//   }
// });
