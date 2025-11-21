module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");

  res.json([
    { id: 1, title: "サンプルスレッドA" },
    { id: 2, title: "サンプルスレッドB" }
  ]);
};
