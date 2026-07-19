function generateExplanation(profile, scholarship) {

  let reasons = [];


  if (
    profile.field &&
    profile.field
      .toLowerCase()
      .includes(scholarship.field.toLowerCase())
  ) {
    reasons.push(
      "Your academic field matches the scholarship requirements"
    );
  }


  if (
    Number(profile.cgpa) >= scholarship.minCGPA
  ) {
    reasons.push(
      "Your CGPA meets the eligibility criteria"
    );
  }


  if (
    profile.country &&
    profile.country
      .toLowerCase()
      .includes(scholarship.country.toLowerCase())
  ) {
    reasons.push(
      "Your preferred country matches this opportunity"
    );
  }


  if (
    profile.funding &&
    profile.funding
      .toLowerCase()
      .includes("fully") &&
    scholarship.funding
      .toLowerCase()
      .includes("fully")
  ) {
    reasons.push(
      "The funding type matches your preference"
    );
  }


  if (reasons.length === 0) {

    reasons.push(
      "This scholarship matches some parts of your profile"
    );

  }


  return reasons;

}


export default generateExplanation;