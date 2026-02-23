export const authorization = (roles = []) => {
  return async (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new Error("UnAuthorized", { cause: 403 });
    }
    next();
  };
};
