import { redisClient } from "./redis.db.js";

export const revoked_key = ({userId, jti}) => {
  return `revoke_token::${userId}::${jti}`
}
export const get_key = (userId) => {
  return `revoke_token::${userId}`
}
export const otp_key = (email) => {
  return `otp::${email}`
}
export const max_otp_key = (email) => {
  return `${otp_key(email)}::max_tries`
}
export const block_otp_key = (email) => {
  return `${otp_key(email)}::block`
}

export const set = async ({ key, value, ttl } = {}) => {
  try {
    const data = typeof value === "string" ? value : JSON.stringify(value);
    return ttl
      ? await redisClient.set(key, data, { EX: ttl })
      : await redisClient.set(key, data);
  } catch (error) {
    console.log("Error to set data in redis", error);
  }
};

export const update = async ({ key, value } = {}) => {
  try {
    if (!(await redisClient.exists(key))) {
      return 0;
    }
    const data = typeof value === "string" ? value : JSON.stringify(value);
    return await redisClient.set(key, data);
  } catch (error) {
    console.log("Error to update data in redis", error);
  }
};

export const get = async (key) => {
  try {
    try {
      return JSON.parse(await redisClient.get(key));
    } catch (err) {
      return await redisClient.get(key);
    }
  } catch (error) {
    console.log("Error to update data in redis", error);
  }
};

export const deleteKey = async (key) => {
  try {
    return await redisClient.del(key);
  } catch (error) {
    console.log("Error to update data in redis", error);
  }
};

export const keys = async (pattern) => {
  try {
    return await redisClient.keys(`${pattern}*`);
  } catch (error) {
    console.log("Error to update data in redis", error);
  }
};

export const exists = async (key) => {
  try {
    return await redisClient.exist(key);
  } catch (error) {
    console.log("Error to update data in redis", error);
  }
};

export const ttl = async (key) => {
  try {
    return await redisClient.ttl(key);
  } catch (error) {
    console.log("Error to update data in redis", error);
  }
};

export const incr = async (key) => {
  try {
    return await redisClient.incr(key);
  } catch (error) {
    console.log("Error to increment operation in redis", error);
  }
};
