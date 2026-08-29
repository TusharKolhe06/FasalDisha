import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts";

export default function PriceChart({ data }) {
  const chartData = [...data]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(x => ({
      date: new Date(x.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      price: x.pricePerQuintal
    }));

  if (!chartData.length) return <p>No price history available.</p>;

  return (
    <div style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="price" strokeWidth={3} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}