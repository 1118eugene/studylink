import { Card } from './Card';

interface ListingCardProps {
  title: string;
  description: string;
  area: string;
  price: string;
}

function ListingCard({ title, description, area, price }: ListingCardProps) {
  return (
    <Card className="listing-card" variant="outlined">
      <Card.Header title={title} titleAs="h3" subtitle={`Session: ${price}`} />
      <Card.Body>
        <Card.Section label="Description">{description}</Card.Section>
        <Card.Meta>Group size: {area}</Card.Meta>
      </Card.Body>
    </Card>
  );
}

export default ListingCard;
