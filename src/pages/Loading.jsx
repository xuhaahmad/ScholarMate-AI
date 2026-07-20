import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function Loading() {

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {

    const timer = setTimeout(() => {

      navigate("/results", {
        state: location.state
      });

    }, 2500);

    return () => clearTimeout(timer);

  }, []);

  return (

    <div className="min-h-screen flex flex-col justify-center items-center bg-background">

      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>

      <h1 className="text-3xl font-bold mt-8">
        🤖 AI is analyzing your profile...
      </h1>

      <p className="mt-4 text-muted">
        Finding the best scholarships for you.
      </p>

    </div>

  );

}

export default Loading;