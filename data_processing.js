d3.csv("./bft_data21.csv").then(function (data) {
  // define organization types for segmentation of nodes around circle
  var groups = [...new Set(data.map((x) => x.Grouping))].map((y, i) => ({
    group: y,
    groupid: "group" + i,
  }));

  console.log(groups);

  //var size = ['large', 'small']
  var nodes = data.map((x, i) => ({
    group: groups.filter((y) => y.group == x.Grouping)[0].groupid,
    name: x.Name,
    id: i,
    xid: "x" + i,
    Y1GP: x.Y1GP,
    Y2GP: x.Y2GP,
    ERF: x.ERF,
    loc: x.Location2,
    size: x.Scale,
  }));

  function getLinks(category) {
    var matrix = [];
    var copy = [...nodes];

    for (var i = 0; i < nodes.length; i++) {
      var temp = [];
      for (var j = 0; j < copy.length; j++) {
        if (nodes[i][category] == copy[j][category]) {
          temp.push(1);
        } else temp.push(0);
      }
      matrix.push(temp);
    }

    // get links from matrix
    var links = [];

    for (var i = 0; i < matrix.length; i++) {
      for (var j = 0; j < matrix[i].length; j++) {
        var temp = {};
        if (matrix[i][j] == 1 && i != j) {
          temp["source"] = "x" + i;
          temp["target"] = "x" + j;
          // temp['targetname'] = nodes.filter(x => x.id == j)[0].name
          temp["link_id"] =
            i > j ? String(j) + String(i) : String(i) + String(j);
          temp["link_id2"] = "x" + i + "x" + j;
          temp["link"] = "link_id" + category;
          temp["category"] = category;
          links.push(temp);
        }
      }
    }

    return links;
  }

  function getFundingLinks(category) {
    var matrix = [];
    var copy = [...nodes];

    for (var i = 0; i < nodes.length; i++) {
      var temp = [];
      for (var j = 0; j < copy.length; j++) {
        if (
          nodes[i][category] == "TRUE" &&
          nodes[i][category] == copy[j][category]
        ) {
          temp.push(1);
        } else temp.push(0);
      }
      matrix.push(temp);
    }

    // get links from matrix
    var links = [];

    for (var i = 0; i < matrix.length; i++) {
      for (var j = 0; j < matrix[i].length; j++) {
        var temp = {};
        if (matrix[i][j] == 1 && i != j) {
          temp["source"] = "x" + i;
          temp["target"] = "x" + j;
          // temp['targetname'] = nodes.filter(x => x.id == j)[0].name
          temp["link_id"] =
            i > j ? String(j) + String(i) : String(i) + String(j);
          temp["link_id2"] = "x" + i + "x" + j;
          temp["link"] = "link_id" + category;
          temp["category"] = category;
          links.push(temp);
        }
      }
    }
    return links;
  }
  var y1gpLinks = getFundingLinks("Y1GP");
  var erfLinks = getFundingLinks("ERF");
  var y2gpLinks = getFundingLinks("Y2GP");
  console.log("test: ", y2gpLinks);

  var locationLinks = getLinks("loc");
  var sizeLinks = getLinks("size");

  var links = y1gpLinks.concat(y2gpLinks, locationLinks); //.concat(sizeLinks);
  console.log(links);

  // // nested array
  var nest = { name: "ftf", children: [] };
  // // unique groups
  var groupids = groups.map((x) => x.groupid);

  nest.children = groupids.map((x) => ({
    name: x,
    children: nodes
      .filter((y) => y.group == x)
      .map((z) => ({
        name: z.xid,
        group: z.group,
        category: links.filter((x) => x.source == z.xid).map((x) => x.category),
        imports: links
          .filter((x) => x.source == z.xid)
          .map((y) => y.target)
          .map(
            (id) =>
              "ftf." + nodes.filter((y) => y.xid == id)[0].group + "." + id
          ),
        y1gp_imports: y1gpLinks
          .filter((x) => x.source == z.xid)
          .map((y) => y.target)
          .map(
            (id) =>
              "ftf." + nodes.filter((y) => y.xid == id)[0].group + "." + id
          ),
        y2gp_imports: y2gpLinks
          .filter((x) => x.source == z.xid)
          .map((y) => y.target)
          .map(
            (id) =>
              "ftf." + nodes.filter((y) => y.xid == id)[0].group + "." + id
          ),
        erf_imports: erfLinks
          .filter((x) => x.source == z.xid)
          .map((y) => y.target)
          .map(
            (id) =>
              "ftf." + nodes.filter((y) => y.xid == id)[0].group + "." + id
          ),
        location_imports: locationLinks
          .filter((x) => x.source == z.xid)
          .map((y) => y.target)
          .map(
            (id) =>
              "ftf." + nodes.filter((y) => y.xid == id)[0].group + "." + id
          ),
        size_imports: sizeLinks
          .filter((x) => x.source == z.xid)
          .map((y) => y.target)
          .map(
            (id) =>
              "ftf." + nodes.filter((y) => y.xid == id)[0].group + "." + id
          ),
      })),
  }));

  console.log(nest);
  var fullData = { nodes: nodes, links: links, nest: nest };

  fullData = JSON.stringify(fullData);

  // function download(content, fileName, contentType) {
  //   var a = document.createElement("a");
  //   var file = new Blob([content], {
  //     type: contentType,
  //   });
  //   a.href = URL.createObjectURL(file);
  //   a.download = fileName;
  //   a.click();
  // }
  // download(fullData, "nested.json", "text/plain");
});
