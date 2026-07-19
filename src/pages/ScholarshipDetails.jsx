import { useLocation } from "react-router-dom";


function ScholarshipDetails() {

  const location = useLocation();

  const scholarship = location.state;


  if (!scholarship) {

    return (
      <div className="p-10">
        <h1 className="text-3xl font-bold">
          Scholarship not found
        </h1>
      </div>
    );

  }


  return (

    <div className="min-h-screen bg-background p-10">


      <div className="max-w-3xl mx-auto bg-white p-8 rounded-3xl shadow">


        <h1 className="text-4xl font-bold text-primary">
          {scholarship.name}
        </h1>


        <p className="mt-4 text-muted">
          {scholarship.description}
        </p>


        <div className="mt-6 space-y-3">


          <p>
            🌍 <b>Country:</b> {scholarship.country}
          </p>


          <p>
            🏫 <b>University:</b> {scholarship.university}
          </p>


          <p>
            💰 <b>Funding:</b> {scholarship.funding}
          </p>


          <p>
            📅 <b>Deadline:</b> {scholarship.deadline}
          </p>


          <p>
            🎯 <b>Your Match Score:</b> {scholarship.score}%
          </p>


        </div>



        <h2 className="text-2xl font-bold mt-8">
          Why AI recommends this:
        </h2>


        <ul className="mt-3 space-y-2 text-gray-600">

          {
            scholarship.reasons.map(
              (reason, index) => (

                <li key={index}>
                  ✅ {reason}
                </li>

              )
            )
          }

        </ul>


      </div>


    </div>

  );

}


export default ScholarshipDetails;