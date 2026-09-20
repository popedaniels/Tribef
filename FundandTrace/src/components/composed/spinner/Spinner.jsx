import { Oval, TailSpin } from "react-loader-spinner";

const TYPES = {
  Oval,
  TailSpin,
};

export default function Spinner({ type, color, height, width }) {
  const SpinnerType = TYPES[type] || Oval;
  return (
    <SpinnerType color={color} height={height} width={width} />
  );
}
