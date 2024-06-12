const getArrayChunks = (array, chunkSize) => {
  const subArrayList = [];
  let subArray = [];
  array.forEach((item, index) => {
    if (array.length === index + 1) {
      subArray.push(item);
      return subArrayList.push(subArray);
    }

    subArray.push(item);

    if (subArray.length === chunkSize) {
      subArrayList.push(subArray);
      subArray = [];
    }
  });

  return subArrayList;
};

export default getArrayChunks;
