import { Card } from './Card';

interface ServiceCardProps {
  title: string;
  description: string;
}

function ServiceCard({ title, description }: ServiceCardProps) {
  return (
    <Card className="service-card" variant="outlined">
      <Card.Header title={title} titleAs="h3" />
      <Card.Body>{description}</Card.Body>
    </Card>
  );
}

export default ServiceCard;
