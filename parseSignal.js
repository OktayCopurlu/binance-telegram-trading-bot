// Function to parse incoming signals
function parseSignal(message) {
  try {
    const lines = message.trim().split("\n");

    const symbolMatch = lines[0].match(/#(\w+\/\w+)/);
    const sideMatch = lines[0].match(/\((Long|Short)/);
    const entryMatch = lines[2].match(/Entry\s*-\s*([\d.]+)/);
    const takeProfitMatches = lines
      .slice(3)
      .filter((line) => line.includes("of profit"))
      .map((line) => {
        const tpMatch = line.match(/([\d.]+)\s+\((\d+)%/);
        return tpMatch ? { price: tpMatch[1], percentage: tpMatch[2] } : null;
      });

    const side = sideMatch ? sideMatch[1].toLowerCase() : null;
    const orderSide = side === "long" ? "buy" : "sell";
    const correctSymbol = symbolMatch ? symbolMatch[1].replace("/", "") : null;

    return {
      symbol: correctSymbol,
      side,
      orderSide: orderSide,
      entry: entryMatch ? parseFloat(entryMatch[1]) : null,
      takeProfits: takeProfitMatches.filter(Boolean),
    };
  } catch (error) {
    console.error("Error parsing signal:", error);
    return null;
  }
}

module.exports = parseSignal;
