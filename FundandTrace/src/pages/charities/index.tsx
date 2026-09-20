import axios from "axios";
import Link from "next/link";
import React, { useState } from "react";
import { useEffect } from "react";
import styled from "styled-components";
import Spinner from "../../components/composed/spinner/Spinner";

interface Charity {
  _id?: string;
  charityName?: string;
}

export default function Charities() {
  const [charities, setCharities] = useState<Charity[]>([]);
  const [loading, setLoading] = useState(true);

  const getCharities = async () => {
    try {
      const res = await axios.get(
        process.env.NEXT_PUBLIC_API_URL + "/api/charities"
      );
      res && setLoading(false);
      res && setCharities(res?.data?.data);
    } catch (error) {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCharities();
  }, []);

  return (
    <Wrapper>
      these are the charities in our db
      {loading ? (
        <Spinner type="TailSpin" width={25} height={25} color={"var(--color-primary)"} />
      ) : (
        charities?.map((charity, i) => (
          <Link key={i} passHref href={`/charities/${charity?._id}`}>
            <a>
              <div>{charity?.charityName}</div>
            </a>
          </Link>
        ))
      )}
    </Wrapper>
  );
}

const Wrapper = styled.main``;
