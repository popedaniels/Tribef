import React, { useState } from "react";
import styled from "styled-components";
import {
  PieChart,
  Pie,
  Sector,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import axios from "axios";
import { useEffect } from "react";
import { config } from "../helperFunctions/helperFunctions";
import Spinner from "../composed/spinner/Spinner";

export default function AdminOverviewCharts({
  loading,
  chartDetails,
  filter,
  setFilter,
}) {
  const CustomTooltip = ({ active, payload, label }) => {
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

  return (
    <Section
      className="d-flex align-items-center justify-content-between charts mx-auto position-relative"
      style={{ width: "90%", minHeight: 50 }}
    >
      {loading && (
        <section
          className="w-100 d-flex align-items-center justify-content-center position-absolute"
          style={{ top: "30%" }}
        >
          <div className="mx-auto my-5">
            <Spinner type="TailSpin" width={30} height={30} color={"var(--color-primary)"} />
          </div>
        </section>
      )}
      <div
        className="bg-white px-4 py-4"
        style={{
          width: "57%",
          maxWidth: "57%",
          height: "450px",
          boxShadow: "0px 12px 48px rgba(50, 50, 71, 0.08)",
        }}
      >
        <div className="mb-3 d-flex align-items-center justify-content-between">
          <h3 className="mb-0">Performance Activity</h3>
          <select
            value={filter}
            name="activity"
            id="activity"
            onChange={(e) => setFilter(Number(e.target.value))}
          >
            <option value="30">Day</option>
            <option value="14">Bi-Weekly</option>
            <option value="7">Weekly</option>
            <option value="1">Monthly</option>
            <option value="6">6 Months</option>
            <option value="3">3 Months(quarterly)</option>
            <option value="12">12 Months(yearly)</option>
          </select>
        </div>

        {chartDetails?.length ? (
          <ResponsiveContainer height={370}>
            <AreaChart
              data={chartDetails}
              margin={{
                top: 10,
                right: 30,
                left: 0,
                bottom: 0,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" padding={{ left: 40 }} />
              <YAxis unit={"£"} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="donations"
                stroke="var(--color-primary)"
                strokeWidth={2}
                fill="#F0F1FE"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <h2 className="my-5 mx-auto text-center">No Data</h2>
        )}
      </div>
      <div
        className="bg-white"
        style={{
          width: "40%",
          height: "450px",
          paddingTop: 50,
          boxShadow: "0px 12px 48px rgba(50, 50, 71, 0.08)",
        }}
      >
        {chartDetails?.length ? (
          <ResponsiveContainer width="100%">
            <PieChart>
              <Pie
                data={chartDetails}
                cx={180}
                cy={180}
                innerRadius={100}
                outerRadius={150}
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
                wrapperStyle={{
                  display: "flex",
                  flexWrap: "wrap",
                  padding: 20,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <h2 className="my-5 mx-auto text-center">No Data</h2>
        )}
      </div>
    </Section>
  );
}

const Section = styled.section`
  h3 {
    font-style: normal;
    font-weight: bold;
    font-size: 18px;
    line-height: 24px;

    color: #514949;
  }
`;
