import React, { useState } from "react";
import styled from "styled-components";

export default function SelectComponent({
  values,
  handleSelect,
  handleSearch,
  handleDefault,
  value,
  placeholder,
  showSearch,
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  return (
    <Select className="d-flex align-items-center justify-content-between mb-4 mb-md-0 px-3">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="w-100 d-flex align-items-center justify-content-between"
        style={{
          border: "none",
          minWidth: "100%",
          borderStyle: "none",
          boxShadow: "none",
          outline: "none",
          background: "white",
          height: "48px",
          padding: 0,
        }}
      >
        <p
          className="mb-0 value"
          style={{
            fontWeight: !value ? 300 : "",
            opacity: !value ? 0.9 : 1,
            fontSize: 16,
          }}
        >
          {value ? value : placeholder}
        </p>
        <img
          src="/images/icons/dropdown.svg"
          width={13}
          height={8}
          className="pt-0 ml-2"
         alt="" />
      </button>

      {showDropdown && (
        <div onClick={() => setShowDropdown(false)} className="overlay"></div>
      )}
      {showDropdown && (
        <div className="dropdown bg-white">
          {showSearch && (
            <input
              type="search"
              autoFocus={true}
              placeholder="Search"
              autoComplete="new-password"
              value={selected}
              onChange={(e) => handleSearch(e.target.value)}
              style={{
                position: "sticky",
                top: 0,
                width: "100%",
                border: "none",
                outline: "none",
                background: "#E5E5E5",
              }}
              className="py-1 px-2"
            />
          )}
          {/* <p
            className="options py-3 mb-0 px-2"
            onClick={() => {
              setShowDropdown(false);
              handleDefault();
            }}
            role="button"
          >
            {value || placeholder}
          </p> */}
          {values.map((element, i) => (
            <p
              className="options mb-0 px-2 py-3"
              key={i}
              onClick={() => {
                handleSelect(element);
                setShowDropdown(false);
              }}
              role="button"
            >
              {element}
            </p>
          ))}
        </div>
      )}
    </Select>
  );
}

const Select = styled.article`
width: 100%;
border: 0.5px solid #C4C4C4;
box-sizing: border-box;
border-radius: 4px;
height: 50px;
@media screen and (max-width: 767px) {
  width: 100%
}
  position: relative;
  .value{
    overflow: hidden;
    whitespace: nowrap;
    max-height: 100%;

  }
  .options{
    @media screen and (max-width: 767px) {
      border-top: 1px solid #E5E5E5
    }
    background: transparent;
    &:hover {
      background: #E5E5E5;
    }
  }
  .dropdown{
    position: absolute;
    top: 110%;
     box-shadow: -2px 4px 48px rgba(50, 50, 71, 0.05),
    2px 10px 24px rgba(50, 50, 71, 0.05);
    z-index: 10000000000;
    cursor: pointer;
    width: max-content;
    max-height: 300px;
    overflow-y: scroll;
    left: -2px;
    @media screen and (max-width: 767px) {
      position: fixed;
      top: 50%;
      left: 50%;
      width: 90%;
      border-radius: 4px;
      max-width: 430px;
      max-height: 400px;
      transform: translate(-50%, -50%)
    }
  }
  .overlay{
    width: 100vw;
    height:100vh;
    position:fixed;
    z-index 1000000;
    left: 0;
    top: 0;
    @media screen and (max-width: 767px) {
      background: rgba(0,0,0,0.5)
    }
  }
`;
