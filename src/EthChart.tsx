import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

// Define the shape of your data
interface PriceData {
  date: string;
  btc?: number;
  eth?: number;
  bnb?: number;
  sol?: number;
  ada?: number;
}

const CryptoChart: React.FC = () => {
  const [data, setData] = useState<PriceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // List of cryptocurrencies to fetch (CoinGecko IDs)
  const coins = ["bitcoin", "ethereum", "binancecoin", "solana", "cardano"];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch data for each cryptocurrency
        const promises = coins.map(async (coin) => {
          const response = await fetch(
            `https://api.coingecko.com/api/v3/coins/${coin}/market_chart?vs_currency=usd&days=365`
          );
          if (!response.ok) {
            throw new Error(`Failed to fetch ${coin}: ${response.statusText}`);
          }
          const result = await response.json();
          return { coin, prices: result.prices || [] };
        });

        const results = await Promise.all(promises);

        // Log raw data for debugging
        results.forEach(({ coin, prices }) => {
          console.log(`${coin} prices length:`, prices.length);
          console.log(`${coin} sample:`, prices.slice(0, 2));
        });

        // Extract raw prices for normalization
        const rawPrices = results.map((result) =>
          result.prices.length > 0
            ? result.prices.map((price: [number, number]) => price[1])
            : Array(365).fill(0)
        );

        // Calculate min and max for each coin
        const minMax = rawPrices.map((prices) => {
          const validPrices = prices.filter((p) => p !== 0 && !isNaN(p));
          const min = validPrices.length > 0 ? Math.min(...validPrices) : 0;
          const max = Math.max(...prices);
          return { min, max };
        });

        // Log min and max for debugging
        minMax.forEach(({ min, max }, i) => {
          console.log(`${coins[i]} min:`, min, "max:", max);
        });

        // Process data into a unified, normalized format
        const combinedData: PriceData[] = [];
        const timestamps = results[0].prices.map(
          (price: [number, number]) => price[0]
        );

        timestamps.forEach((timestamp, index) => {
          const entry: PriceData = {
            date: new Date(timestamp).toLocaleDateString(),
          };
          results.forEach((result, i) => {
            const coinKey = coins[i].slice(0, 3).toLowerCase(); // Ensure this matches the keys in PriceData
            const rawPrice = result.prices[index]?.[1] || 0;
            const { min, max } = minMax[i];
            const normalized =
              max === min ? 0.5 : (rawPrice - min) / (max - min); // Set to 0.5 if min === max
            entry[coinKey as keyof PriceData] = isNaN(normalized)
              ? 0
              : normalized;
            console.log(`${coinKey} at index ${index}:`, {
              rawPrice,
              min,
              max,
              normalized,
            });
          });
          combinedData.push(entry);
        });

        // Log processed data for debugging
        console.log("Processed Data Sample:", combinedData.slice(0, 5));
        console.log("Data Length:", combinedData.length);

        setData(combinedData);
      } catch (err) {
        console.error("Fetch Error:", err);
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return <div className="text-center p-6 text-gray-600">Loading...</div>;
  }

  if (error) {
    return <div className="text-center p-6 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Top Cryptocurrencies Price History (Normalized)
      </h2>
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <LineChart
          width={900}
          height={400}
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" stroke="#6b7280" />
          <YAxis
            stroke="#6b7280"
            domain={[0, 1]}
            tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#f9fafb",
              borderColor: "#d1d5db",
            }}
            labelStyle={{ color: "#374151" }}
            formatter={(value: number) => `${(value * 100).toFixed(2)}%`}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="bit"
            name="Bitcoin (BTC)"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="eth"
            name="Ethereum (ETH)"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="bin"
            name="Binance Coin (BNB)"
            stroke="#facc15"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="sol"
            name="Solana (SOL)"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="car"
            name="Cardano (ADA)"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </div>
    </div>
  );
};

export default CryptoChart;
