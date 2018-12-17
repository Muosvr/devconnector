const stripWhiteSpace = str => {
  return str.replace(/(^\s+|\s+$)/g, "");
};

module.exports = stripWhiteSpace;
