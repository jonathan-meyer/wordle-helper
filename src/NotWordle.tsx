import { Card, Container } from "react-bootstrap";

const NotWordle = () => {
  return (
    <Container fluid className="m-0 p-2">
      <Card bg="dark" text="light" className="mb-auto">
        <Card.Body>
          <p>This is the not Wordle.</p>
          <p>
            Go to{" "}
            <a
              href="https://www.nytimes.com/games/wordle/index.html"
              target="_blank"
              rel="noreferrer"
            >
              Wordle
            </a>{" "}
            and try again.
          </p>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default NotWordle;
