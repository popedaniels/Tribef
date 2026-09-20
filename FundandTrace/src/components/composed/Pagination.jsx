import React from "react";

export default function Pagination({ setQuery, query, count }) {
  return (
    <div
      className="mt-4 mx-auto d-flex align-items-center"
      style={{ width: "max-content" }}
    >
      {[...Array(Math.ceil(count / 10 + 1)).keys()].slice(1).map((arr, i) => (
        <button
          style={{ outline: "none", height: 25, lineHeight: "20px" }}
          className={`${
            query == arr ? "btn-primary" : "btn-white border"
          } px-2 mx-1 btn p-0`}
          key={arr}
          onClick={() => setQuery(arr)}
        >
          {arr}
        </button>
      ))}
    </div>
  );
}
