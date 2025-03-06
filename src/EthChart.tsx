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
import HeatMapModule from "react-heatmap-grid";
const HeatMap = HeatMapModule.default; // Access the default export

interface PriceData {
  date: string;
  btc?: number;
  eth?: number;
  bnb?: number;
  sol?: number;
  ada?: number;
  [key: string]: number | string | undefined;
}

const EthChart: React.FC = () => {
  const [data, setData] = useState<PriceData[]>([]);
  const [correlationMatrix, setCorrelationMatrix] = useState<number[][]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const coins = ["bitcoin", "ethereum", "binancecoin", "solana", "cardano"];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

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

        const combinedData: PriceData[] = [];
        const minMax = results.map((result) => {
          const prices = result.prices.map(
            (price: [number, number]) => price[1]
          );
          return {
            min: Math.min(...prices),
            max: Math.max(...prices),
          };
        });
        const timestamps = results[0].prices.map(
          (price: [number, number]) => price[0]
        );

        timestamps.forEach((timestamp, index) => {
          const entry: PriceData = {
            date: new Date(timestamp).toLocaleDateString(),
          };
          results.forEach((result, i) => {
            const coinKey = coins[i].slice(0, 3).toLowerCase();
            const rawPrice = result.prices[index]?.[1] || 0;
            const { min, max } = minMax[i];
            const normalized =
              max === min ? 0.5 : (rawPrice - min) / (max - min);
            entry[coinKey as keyof PriceData] = isNaN(normalized)
              ? 0
              : normalized;
          });
          combinedData.push(entry);
        });

        setData(combinedData);

        const matrix = calculateCorrelationMatrix(combinedData);
        setCorrelationMatrix(matrix);
      } catch (err) {
        console.error("Fetch Error:", err);
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const calculateCorrelationMatrix = (data: PriceData[]) => {
    const coins = ["btc", "eth", "bnb", "sol", "ada"];
    const matrix: number[][] = Array.from({ length: coins.length }, () =>
      Array(coins.length).fill(0)
    );

    for (let i = 0; i < coins.length; i++) {
      for (let j = 0; j < coins.length; j++) {
        const coinA = coins[i];
        const coinB = coins[j];
        const pricesA = data
          .map((entry) => entry[coinA] || 0)
          .filter((value): value is number => typeof value === "number");
        const pricesB = data
          .map((entry) => entry[coinB] || 0)
          .filter((value): value is number => typeof value === "number");
        matrix[i][j] = pearsonCorrelation(pricesA, pricesB);
      }
    }

    return matrix;
  };

  const pearsonCorrelation = (x: number[], y: number[]) => {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.map((val, i) => val * y[i]).reduce((a, b) => a + b, 0);
    const sumX2 = x.map((val) => val * val).reduce((a, b) => a + b, 0);
    const sumY2 = y.map((val) => val * val).reduce((a, b) => a + b, 0);

    const numerator = sumXY - (sumX * sumY) / n;
    const denominator = Math.sqrt(
      (sumX2 - (sumX * sumX) / n) * (sumY2 - (sumY * sumY) / n)
    );

    return denominator === 0 ? 0 : numerator / denominator;
  };

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
            dataKey="btc"
            name="Bitcoin (BTC)"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={false}
            strokeDasharray="5 5"
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
            dataKey="bnb"
            name="Binance Coin (BNB)"
            stroke="#facc15"
            strokeWidth={2}
            dot={false}
            strokeDasharray="5 5"
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
            dataKey="ada"
            name="Cardano (ADA)"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            strokeDasharray="5 5"
          />
        </LineChart>
      </div>

      <h2 className="text-2xl font-bold text-gray-800 mb-4 mt-8">
        Correlation Matrix
      </h2>
      <div className="bg-white p-4 rounded-lg shadow-lg">
        {/* <HeatMap
          xLabels={["BTC", "ETH", "BNB", "SOL", "ADA"]}
          yLabels={["BTC", "ETH", "BNB", "SOL", "ADA"]}
          data={correlationMatrix}
          squares
          height={45}
          cellStyle={(background, value, min, max, data, x, y) => ({
            background: `rgb(${
              value < 0 ? "0, 0, 255" : "255, 0, 0"
            }, ${Math.abs(value)})`,
            fontSize: "11px",
            color: "#fff",
          })}
          cellRender={(value) => value?.toFixed(2)}
        /> */}
      </div>
    </div>
  );
};

export default EthChart;
