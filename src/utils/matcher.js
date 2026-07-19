function calculateMatch(profile, scholarship) {

  let score = 0;


  // Field match
  if (
    profile.field &&
    profile.field
      .toLowerCase()
      .includes(scholarship.field.toLowerCase())
  ) {
    score += 40;
  }


  // CGPA match
  if (
    Number(profile.cgpa) >= scholarship.minCGPA
  ) {
    score += 30;
  }


  // Country preference
  if (
    profile.country &&
    profile.country
      .toLowerCase()
      .includes(scholarship.country.toLowerCase())
  ) {
    score += 20;
  }


  // Funding preference
  if (
    profile.funding &&
    profile.funding
      .toLowerCase()
      .includes("fully")
  ) {

    if (
      scholarship.funding
        .toLowerCase()
        .includes("fully")
    ) {
      score += 10;
    }

  }


  return score;

}


export default calculateMatch;