const getProfile = async (req, res, next) => {
  // already logged in once
  if (req.profile) return next();

  // not logged yet, find profile
  const { Profile } = req.app.get("models");
  const profile = await Profile.findOne({
    where: { id: req.get("profile_id") || 0 },
  });

  // no profile found
  if (!profile) {
    req.profile = null;
    return res.status(401).send({ ok: false, code: "unauthorized" });
  }

  // profile found
  req.profile = profile;
  next();
};
module.exports = { getProfile };
