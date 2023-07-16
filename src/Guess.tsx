import { Badge, BadgeProps } from "react-bootstrap";

export interface GuessProps extends BadgeProps {
  word: string;
}

const Guess = ({ word, ...props }: GuessProps) => {
  return (
    <Badge pill role="button" {...props}>
      {word}
    </Badge>
  );
};

export default Guess;
