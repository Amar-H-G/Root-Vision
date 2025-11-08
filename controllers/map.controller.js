exports.home = async (req, res) => {
  // You can compute/lookup defaults here if needed
  const center = [22.5726, 88.3639]; // Kolkata
  const zoom = 12;
  res.render("view", { center, zoom });
};
