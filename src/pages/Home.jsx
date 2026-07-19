import { useNavigate } from "react-router-dom";


function Home() {

  const navigate = useNavigate();


  return (

    <div className="min-h-screen bg-background">


      {/* Navbar */}

      <nav className="flex justify-between items-center px-10 py-6">

        <h1 className="text-2xl font-bold text-primary">
          ScholarMate AI 🎓
        </h1>


        <div className="space-x-6 text-gray-600">

          <span>
            Features
          </span>


          <span>
            About
          </span>


        </div>


      </nav>



      {/* Hero Section */}

      <div className="flex justify-center items-center px-5 py-20">


        <div className="text-center max-w-3xl">


          <h1 className="text-6xl font-bold text-primary">

            Find Your Perfect Scholarship With AI 🤖

          </h1>



          <p className="mt-6 text-xl text-muted">

            ScholarMate analyzes your academic profile and
            recommends scholarships that fit your goals.

          </p>



          <button

            onClick={() => navigate("/profile")}

            className="mt-8 bg-primary text-white px-10 py-4 rounded-2xl text-lg"

          >

            Start Your Journey 🚀

          </button>



          {/* Feature Cards */}

          <div className="grid md:grid-cols-3 gap-5 mt-16">


            <div className="bg-white p-6 rounded-3xl shadow">

              🤖

              <h3 className="font-bold mt-3">
                AI Matching
              </h3>

              <p className="text-sm text-gray-500 mt-2">
                Smart scholarship recommendations.
              </p>

            </div>



            <div className="bg-white p-6 rounded-3xl shadow">

              🌍

              <h3 className="font-bold mt-3">
                Global Opportunities
              </h3>

              <p className="text-sm text-gray-500 mt-2">
                Discover scholarships worldwide.
              </p>

            </div>



            <div className="bg-white p-6 rounded-3xl shadow">

              🎓

              <h3 className="font-bold mt-3">
                Personalized Advice
              </h3>

              <p className="text-sm text-gray-500 mt-2">
                Recommendations based on your profile.
              </p>

            </div>


          </div>


        </div>


      </div>


    </div>

  );

}


export default Home;