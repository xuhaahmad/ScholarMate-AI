import { useState } from "react";
import { useNavigate } from "react-router-dom";


function Profile() {
console.log("Profile loaded");
  const navigate = useNavigate();


  const [profile, setProfile] = useState({
    name: "",
    field: "",
    cgpa: "",
    country: "",
    funding: ""
  });


  function handleChange(e) {

    setProfile({
      ...profile,
      [e.target.name]: e.target.value
    });

  }


  function handleSubmit(e) {

    e.preventDefault();

navigate("/loading", {
  state: profile
});

  }


  return (

    <div className="min-h-screen bg-background p-10">


      <h1 className="text-4xl font-bold text-center text-primary">
        ScholarMate AI 🎓
      </h1>


      <p className="text-center mt-3 text-muted">
        Find scholarships matched to your profile.
      </p>



      <form
        onSubmit={handleSubmit}
        className="max-w-xl mx-auto mt-10 bg-white p-8 rounded-3xl shadow space-y-5"
      >


        <input
          name="name"
          placeholder="Your Name"
          value={profile.name}
          onChange={handleChange}
          className="w-full border p-3 rounded-xl"
        />


        <input
          name="field"
          placeholder="Your Field (e.g Computer Science)"
          value={profile.field}
          onChange={handleChange}
          className="w-full border p-3 rounded-xl"
        />


        <input
          name="cgpa"
          placeholder="CGPA"
          value={profile.cgpa}
          onChange={handleChange}
          className="w-full border p-3 rounded-xl"
        />


        <input
          name="country"
          placeholder="Preferred Country"
          value={profile.country}
          onChange={handleChange}
          className="w-full border p-3 rounded-xl"
        />


        <input
          name="funding"
          placeholder="Funding Preference"
          value={profile.funding}
          onChange={handleChange}
          className="w-full border p-3 rounded-xl"
        />


        <button
          className="w-full bg-primary text-white py-3 rounded-xl"
        >
          Find Scholarships 🚀
        </button>


      </form>


    </div>

  );

}


export default Profile;