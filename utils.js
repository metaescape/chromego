function isTimeInAllowedRange() {
  const now = new Date();
  const currentHour = now.getHours();
  return currentHour >= 12 && currentHour < 13;
}

export { isTimeInAllowedRange };
