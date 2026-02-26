import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="d-flex flex-column align-items-center justify-content-center h-100 text-center p-5">
      <div className="brand-badge mb-4" style={{ width: '80px', height: '80px', fontSize: '2rem' }}>
        404
      </div>
      <h1 className="fw-bold mb-3" style={{ fontSize: '3rem' }}>Lost in Space?</h1>
      <p className="text-muted fs-5 mb-5 max-w-md">
        The page you are looking for doesn't exist or has been moved.
        Don't worry, your data is safe!
      </p>
      <button
        className="btn btn-gradient px-5 py-3 fw-bold rounded-pill"
        onClick={() => navigate("/app")}
      >
        Back to Dashboard
      </button>
    </div>
  );
}