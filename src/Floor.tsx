interface Props {
  floor: number;
}

const Floor = ({ floor }: Props) => {
  if (floor === 0) return <span>G</span>;
  return <span>{floor}</span>;
};

export default Floor;
