function isTimeInAllowedRange() {
  const now = new Date();
  const currentHour = now.getHours();
  return currentHour >= 9 && currentHour < 10;
}

export { isTimeInAllowedRange };
