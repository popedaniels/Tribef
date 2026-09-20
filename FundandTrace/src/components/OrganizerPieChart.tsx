import React from "react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface ChartDatum {
  name: string;
  donations: number;
  color: string;
}

interface TooltipEntry {
  name?: string;
  payload: { donations?: number };
}

const CustomTooltip = ({
  active = false,
  payload = [],
}: {
  active?: boolean;
  payload?: TooltipEntry[];
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip bg-white py-2 px-2 shadow">
        <p className="intro">{`${payload[0].name}`}</p>
        <p className="label">{`Donations: £${payload[0].payload.donations}`}</p>
      </div>
    );
  }
  return null;
};

export default function OrganizerPieChart({ chartDetails }: { chartDetails: ChartDatum[] }) {
  if (!chartDetails?.length) {
    return <h2 className="my-5 mx-auto text-center">No Data</h2>;
  }
  return (
    <ResponsiveContainer width="100%">
      <PieChart>
        <Pie
          data={chartDetails}
          cx={160}
          cy={160}
          innerRadius={80}
          outerRadius={130}
          fill="#8884d8"
          dataKey="donations"
          blendStroke
        >
          {chartDetails.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          align="right"
          wrapperStyle={{
            display: "flex",
            flexWrap: "wrap",
            paddingLeft: 15,
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
