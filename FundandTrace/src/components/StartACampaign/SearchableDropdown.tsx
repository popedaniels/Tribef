import React from "react";
import { Select } from "./Team.styles";

interface CountryOption {
  name: string;
  phone_code: string;
  href: { flag: string };
  states: string[];
}

interface StateOption {
  name: string;
}

type Option = CountryOption | StateOption;

interface Props {
  value: string;
  placeholder: string;
  options: Option[];
  show: boolean;
  setShow: (show: boolean) => void;
  searchValue: string;
  setSearchValue: (v: string) => void;
  onSelect: (opt: Option) => void;
  onClear?: () => void;
}

export const SearchableDropdown: React.FC<Props> = ({
  value,
  placeholder,
  options,
  show,
  setShow,
  searchValue,
  setSearchValue,
  onSelect,
  onClear,
}) => (
  <Select className="d-flex align-items-center justify-content-between name mb-4 mb-md-0">
    <button
      onClick={() => setShow(!show)}
      className="w-100 d-flex align-items-center justify-content-between px-3"
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
          fontSize: !value ? 14 : 16,
        }}
      >
        {value ? value : placeholder}
      </p>
      <img
        src="/images/icons/dropdown.svg"
        width={13}
        height={8}
        className="pt-0 ml-2"
        alt="dropdown"
      />
    </button>

    {show && <div onClick={() => setShow(false)} className="overlay"></div>}
    {show && (
      <div className="dropdown bg-white">
        <input
          type="search"
          autoFocus={true}
          placeholder="Search"
          autoComplete="new-password"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
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
        <p
          className="options py-3 mb-0 px-2"
          onClick={() => {
            setShow(false);
            onClear && onClear();
          }}
          role="button"
        >
          {placeholder}
        </p>
        {options?.map((opt: any, i: number) => (
          <p
            className="options mb-0 px-2 py-3"
            key={i}
            onClick={() => {
              onSelect(opt);
              setShow(false);
            }}
            role="button"
          >
            {opt?.name}
          </p>
        ))}
      </div>
    )}
  </Select>
);

interface PhoneDropdownProps {
  value: string;
  flag: string;
  options: CountryOption[];
  show: boolean;
  setShow: (show: boolean) => void;
  searchValue: string;
  setSearchValue: (v: string) => void;
  onSelect: (opt: CountryOption) => void;
  onClear?: () => void;
}

export const PhoneDropdown: React.FC<PhoneDropdownProps> = ({
  value,
  flag,
  options,
  show,
  setShow,
  searchValue,
  setSearchValue,
  onSelect,
  onClear,
}) => (
  <Select
    className="d-flex align-items-center"
    style={{
      background: "white",
      position: "static",
      width: "max-content",
      paddingRight: 10,
      height: "48px",
      top: "0",
      paddingLeft: 10,
      borderRight: "0.5px solid #c4c4c4",
    }}
  >
    <button
      onClick={() => setShow(!show)}
      className="d-flex align-items-center"
      style={{
        border: "none",
        minWidth: "100%",
        borderStyle: "none",
        boxShadow: "none",
        outline: "none",
        background: "white",
        height: "48px",
        padding: 0,
        width: "max-content",
      }}
    >
      <div
        className="d-flex align-items-center value"
        style={{
          fontWeight: !value ? 300 : "",
          opacity: !value ? 0.9 : 1,
          fontSize: !value ? 14 : 16,
        }}
      >
        {flag && <img src={flag} alt="" width={15} className="mr-2" />}
        <p className="mb-0 ">{value ? value : "Phone"}</p>
      </div>
      <img
        src="/images/icons/dropdown.svg"
        width={13}
        height={8}
        className="pt-0 ml-2"
        alt="dropdown"
      />
    </button>
    {show && <div onClick={() => setShow(false)} className="overlay"></div>}
    {show && (
      <>
        <div className="dropdown bg-white">
          <input
            type="search"
            autoFocus={true}
            placeholder="Search by country"
            autoComplete="new-password"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            style={{
              position: "sticky",
              top: 0,
              width: "100%",
              border: "none",
              outline: "none",
              background: "#E5E5E5",
              zIndex: 1000,
            }}
            className="py-1 px-2"
          />
          <p
            className="options py-3 mb-0 px-2"
            onClick={() => {
              setShow(false);
              onClear && onClear();
            }}
            role="button"
          >
            Phone
          </p>
          {options?.map((phone, i) => (
            <div
              className="options py-3 mb-0 px-2 d-flex align-items-center"
              key={i}
              onClick={() => {
                onSelect(phone);
                setShow(false);
              }}
              role="button"
            >
              <img src={phone?.href.flag} alt="" width={15} />
              <p className="ml-2 mb-0">{phone?.phone_code}</p>
              <p className="ml-2 mb-0">{phone?.name}</p>
            </div>
          ))}
        </div>
      </>
    )}
  </Select>
);
