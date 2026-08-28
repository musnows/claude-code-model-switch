function findStartModelIndex(args) {
  for (let index = 0; index < args.length - 1; index += 1) {
    if (args[index] === 'start' && args[index + 1] && !args[index + 1].startsWith('-')) {
      return index;
    }
  }

  return -1;
}

function normalizeStartCommandArgs(args) {
  if (args[0] === 'start') {
    return args;
  }

  const startIndex = findStartModelIndex(args);
  if (startIndex === -1) {
    return args;
  }

  const modelName = args[startIndex + 1];
  return [
    'start',
    modelName,
    ...args.slice(0, startIndex),
    ...args.slice(startIndex + 2),
  ];
}

module.exports = {
  findStartModelIndex,
  normalizeStartCommandArgs,
};
