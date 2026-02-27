import { Badge } from "react-bootstrap";

export default function StockMovementBadge({ type }) {
    switch (type) {
        case 'increase': return <Badge bg="success">STOCK INCREASE</Badge>;
        case 'decrease': return <Badge bg="danger">STOCK DECREASE</Badge>;
        case 'out': return <Badge bg="info">SALE (OUT)</Badge>;
        case 'return': return <Badge bg="primary">ITEM RETURN</Badge>;
        case 'damaged': return <Badge bg="dark">DAMAGED</Badge>;
        case 'adjustment': return <Badge bg="warning" text="dark">MANUAL ADJUSTMENT</Badge>;
        default: return <Badge bg="secondary">{type?.toUpperCase()}</Badge>;
    }
}
