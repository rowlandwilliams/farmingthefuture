var padding = 30;
// get bottom of credits and use to set height
function setDash() {
  var db_height = document.getElementById("credits").getBoundingClientRect().y;
  document
    .getElementById("dashboard")
    .setAttribute("style", "height:" + db_height + "px");
}

document
  .getElementById("network")
  .setAttribute("style", "height:" + window.innerHeight * 0.94 + "px"); // set graph height

var link = "./nested_new.json";
//var link = './bft_data.csv'

d3.json(link).then(function (data) {
  var nodes = data.nodes;
  console.log(nodes);
  var nest = data.nest;

  // set group colours
  var colG = [
    "#ffb347",
    "#45eaf0",
    "#fdfd96",
    "#8ed253",
    "#a80348",
    "#a52a94",
    "#d21044",
    "#03c03c",
    "#779ecb",
  ];
  var groups = [
    "group0",
    "group1",
    "group2",
    "group3",
    "group4",
    "group5",
    "group6",
    "group7",
    "group8",
  ];
  var groupNames = [
    "Education",
    "Farmer's Network",
    "NGO Policy / Campaign group",
    "Farmer's Network & Education",
    "Community Food Project",
    "University / Research Centre",
    "Ethical Business",
    "Conservation Charity",
    "Tech",
  ];
  var sizeColor = "#fca474";
  var y1gpColor = "#fdfd96";

  // plot dimenstions
  var width = document.getElementById("network").offsetWidth;
  var height = document.getElementById("network").offsetHeight;
  var radius = Math.min(width, height) * 0.6;
  if (radius > 450) {
    radius = 450;
  }

  console.log(radius);

  // cluster data
  colornone = "#ccc";
  tree = d3.cluster().size([2 * Math.PI, radius - 200]);

  // define line, control bundle with beta
  line = d3
    .lineRadial()
    .curve(d3.curveBundle.beta(0.85))
    .radius((d) => d.y)
    .angle((d) => d.x);

  // function to identify id of linked components
  function id(node) {
    return `${node.parent ? id(node.parent) + "." : ""}${node.data.name}`;
  }

  // account for outgoing (imports)
  function bilink(root) {
    const map = new Map(root.leaves().map((d) => [id(d), d]));
    for (const d of root.leaves())
      (d.outgoing = d.data.imports.map((i) => [d, map.get(i)])),
        (d.y1gp_outgoing = d.data.y1gp_imports.map((i) => [d, map.get(i)])),
        (d.y2gp_outgoing = d.data.y2gp_imports.map((i) => [d, map.get(i)])),
        (d.erf_outgoing = d.data.erf_imports.map((i) => [d, map.get(i)])),
        (d.loc_outgoing = d.data.location_imports.map((i) => [d, map.get(i)])), // create location and size outgoing
        (d.size_outgoing = d.data.size_imports.map((i) => [d, map.get(i)]));
    return root;
  }

  const root = tree(
    bilink(
      d3
        .hierarchy(nest)
        .sort(
          (a, b) =>
            d3.ascending(a.height, b.height) ||
            d3.ascending(a.data.name, b.data.name)
        )
    )
  );

  const svg = d3
    .select("#network")
    .append("svg")
    .attr("viewBox", [-width / 2, -height / 2, width, height])
    .attr("class", "svg");

  // add change var for each quadrant for label adjustment
  var change1 = 80;
  var change2 = 0;
  var change3 = 80;
  var change4 = 0;

  let g = svg
    .append("g")
    .attr("class", "links")
    // .attr("stroke", colornone)
    .attr("fill", "none");

  g.selectAll("locpath") // append location links
    .data(root.leaves().flatMap((leaf) => leaf.loc_outgoing))
    .enter()
    .append("path")
    .style("mix-blend-mode", "multiply")
    .style("opacity", 0.1)
    .style("stroke", "#966FD6") //'#966FD6')
    .attr("d", ([i, o]) => line(i.path(o)))
    .attr("class", "locpath")
    .each(function (d) {
      d.loc_path = this;
    });

  g.selectAll("sizepath") // append size links
    .data(root.leaves().flatMap((leaf) => leaf.size_outgoing))
    .enter()
    .append("path")
    .style("mix-blend-mode", "multiply")
    .style("opacity", 0.1)
    .style("stroke", sizeColor)
    .attr("d", ([i, o]) => line(i.path(o)))
    .attr("class", "sizepath")
    .each(function (d) {
      d.size_path = this;
    });

  g.selectAll("erfpath") // append location links
    .data(root.leaves().flatMap((leaf) => leaf.erf_outgoing))
    .enter()
    .append("path")
    .style("mix-blend-mode", "multiply")
    .style("opacity", 0.1)
    .style("stroke", "#03c03c") //'#966FD6')
    .attr("d", ([i, o]) => line(i.path(o)))
    .attr("class", "erfpath")
    .each(function (d) {
      d.erf_path = this;
    });

  g.selectAll("y2gppath") // append location links
    .data(root.leaves().flatMap((leaf) => leaf.y2gp_outgoing))
    .enter()
    .append("path")
    .style("mix-blend-mode", "multiply")
    .style("opacity", 0.1)
    .style("stroke", "pink") //'#966FD6')
    .attr("d", ([i, o]) => line(i.path(o)))
    .attr("class", "y2gppath")
    .each(function (d) {
      d.y2gp_path = this;
    });

  g.selectAll("y1gppath") // append location links
    .data(root.leaves().flatMap((leaf) => leaf.y1gp_outgoing))
    .enter()
    .append("path")
    .style("mix-blend-mode", "multiply")
    .style("opacity", 0.1)
    .style("stroke", y1gpColor) //'#966FD6')
    .attr("d", ([i, o]) => line(i.path(o)))
    .attr("class", "y1gppath")
    .each(function (d) {
      d.y1gp_path = this;
    });

  const node = svg
    .append("g") // add nodes
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .attr("fill", "#202020")
    .selectAll("g")
    .data(root.leaves())
    .join("g")
    .attr(
      "transform",
      (d) => `rotate(${(d.x * 180) / Math.PI - 90}) translate(${d.y},0)`
    )
    .attr("class", (d) => "group " + d.data.group)
    .attr("id", function (d) {
      return d.data.name;
    })
    .on("mouseover", overed)
    .on("mouseout", outed)
    .each(function (d) {
      // calculate angle from respective 0
      // node to label length and associated transltation from node
      var nLength = 15;
      var labOffset = 5;

      if (d.x < 0.5 * Math.PI) {
        if (d.x < 0.25 * Math.PI) {
          nLength = nLength + change1;
          change1 = change1 - 8;
        }
        d.nLength = nLength;
        d.angle = Math.abs((d.x * 180) / Math.PI - 90);
        d.transX = nLength * Math.cos((d.angle * Math.PI) / 180) + labOffset;
        d.transY = -nLength * Math.sin((d.angle * Math.PI) / 180) - labOffset;
      } else if (d.x >= 0.5 * Math.PI && d.x < Math.PI) {
        if (d.x > 0.75 * Math.PI) {
          nLength = nLength + change2;
          change2 = change2 + 6;
        }
        d.nLength = nLength;
        d.angle = (d.x * 180) / Math.PI - 90;
        d.transX = nLength * Math.cos((d.angle * Math.PI) / 180) + labOffset;
        d.transY = nLength * Math.sin((d.angle * Math.PI) / 180) + labOffset;
      } else if (d.x >= Math.PI && d.x < Math.PI * 1.5) {
        if (d.x < 1.3 * Math.PI) {
          nLength = nLength + change3;
          change3 = change3 - 8;
        }
        d.nLength = nLength;
        d.angle = 180 - ((d.x * 180) / Math.PI - 90);
        d.transX = -(nLength * Math.cos((d.angle * Math.PI) / 180)) - labOffset;
        d.transY = nLength * Math.sin((d.angle * Math.PI) / 180) + labOffset;
      } else {
        if (d.x > 1.85 * Math.PI) {
          nLength = nLength + change4;
          change4 = change4 + 8;
        }
        d.nLength = nLength;
        d.angle = (d.x * 180) / Math.PI - 90 - 180;
        d.transX = -(nLength * Math.cos((d.angle * Math.PI) / 180)) - labOffset;
        d.transY = -nLength * Math.sin((d.angle * Math.PI) / 180) - labOffset;
      } // node positioning
    });

  const labels = node // add labels
    .append("text")
    .attr("dy", "0.31em")
    .attr("x", (d) => (d.x < Math.PI ? 30 : -30))
    .attr("class", "label")
    .attr("fill", "#202020")
    .style("font-size", "12px")
    .style("font-weight", 200)
    .attr("id", function (d) {
      return "lab" + d.data.name;
    })
    .text(function (d) {
      return nodes.filter((x) => x.xid == d.data.name)[0].name;
    })
    .each(function (d) {
      d.text = this;
    })
    .attr("text-anchor", (d) => (d.x < Math.PI ? "start" : "end"))
    .attr("transform", function (d) {
      return this.getAttribute("transform") + // rotate back to horizontal
        d.x <
        Math.PI
        ? "rotate(" + -1 * `${(d.x * 180) / Math.PI - 90}` + ")"
        : "rotate(" + `${(d.x * -180) / Math.PI + 90}` + ")";
    });

  labels.each(function (d, i) {
    //transform labels based on trig calculations
    d3.select(this).attr("y", d.transY);
    d3.select(this).attr("x", d.transX);
    d.labWidth = this.getBBox().width + 5;
  });

  node
    .append("rect")
    .attr("width", (d) => d.nLength)
    .attr("height", 0.75)
    .style("fill", "grey")
    .attr("class", "nodeLine")
    .attr("id", function (d) {
      return d.data.name;
    })
    .each(function (d) {
      d.nodeLine1 = this;
    });

  node
    .append("rect")
    .attr("width", (d) => d.labWidth)
    .attr("height", 0.75)
    .style("fill", "grey")
    .attr("class", "nodeLine")
    .attr("id", function (d) {
      return d.data.name;
    })
    .attr("transform", function (d) {
      return this.getAttribute("transform") + // rotate back to horizontal
        d.x <
        Math.PI
        ? "rotate(" + -1 * `${(d.x * 180) / Math.PI - 90}` + ")"
        : "rotate(" + -1 * `${(d.x * 180) / Math.PI + 90}` + ")";
    })
    .each(function (d) {
      if (d.x < 0.5 * Math.PI) {
        d3.select(this).attr("y", d.transY + 5);
        d3.select(this).attr("x", d.transX - 5);
      } else if (d.x >= 0.5 * Math.PI && d.x < Math.PI) {
        d3.select(this).attr("y", d.transY - 5);
        d3.select(this).attr("x", d.transX - 5);
      } else if (d.x >= Math.PI && d.x < 1.5 * Math.PI) {
        d3.select(this).attr("y", -d.transY + 5);
        d3.select(this).attr("x", -d.transX - 5);
      } else {
        d3.select(this).attr("y", -d.transY - 5);
        d3.select(this).attr("x", -d.transX - 5);
      }
    })
    .each(function (d) {
      d.nodeLine2 = this;
    });

  node // add circles
    .append("circle")
    .attr("r", 5)
    .attr("class", "node")
    .attr("id", function (d) {
      return d.data.name;
    }) //.attr('class', function(d) {return d.x < Math.PI ? "right" : "left"})
    .style("fill", function (d) {
      return colG[groups.indexOf(d.data.group)];
    })
    .each(function (d) {
      d.circle = this;
    });

  function overed(d) {
    var nodeId = d3.select(this).attr("id");

    g.selectAll("path").style("mix-blend-mode", null).style("opacity", 0.01); //.style('stroke', colornone)
    d3.select(d.text).style("font-weight", "bold");

    if (sizeState == "on") {
      d3.selectAll(d.size_outgoing.map((d) => d.size_path))
        .style("stroke", sizeColor)
        .raise()
        .style("opacity", 1);

      d3.select("#db_sizetext").text(
        nodes.filter((x) => x.xid == nodeId)[0].size
      );

      d3.selectAll(d.size_outgoing.map(([, d]) => d.text))
        .attr("fill", sizeColor)
        .style("opacity", 1);
    }

    if (locState == "on") {
      d3.selectAll(d.loc_outgoing.map((d) => d.loc_path))
        .style("stroke", "#966FD6")
        .raise()
        .style("opacity", 1);

      d3.select("#db_locationText").text(
        nodes.filter((x) => x.xid == nodeId)[0].loc
      );

      d3.selectAll(d.loc_outgoing.map(([, d]) => d.text))
        .attr("fill", "#966FD6")
        .style("opacity", 1);
    }

    if (erfState == "on") {
      d3.selectAll(d.erf_outgoing.map((d) => d.erf_path))
        .style("stroke", "#03c03c")
        .raise()
        .style("opacity", 1);

      d3.select("#db_erfText").text(
        nodes.filter((x) => x.xid == nodeId)[0].ERF == "FALSE"
          ? "No funding received"
          : "Funding received"
      );
      d3.selectAll(d.erf_outgoing.map(([, d]) => d.text))
        .attr("fill", "#03c03c")
        .style("opacity", 1);
    }

    if (y2gpState == "on") {
      d3.selectAll(d.y2gp_outgoing.map((d) => d.y2gp_path))
        .style("stroke", "pink")
        .raise()
        .style("opacity", 1);

      d3.select("#db_y2gpText").text(
        nodes.filter((x) => x.xid == nodeId)[0].Y2GP == "FALSE"
          ? "No funding received"
          : "Funding received"
      );
      d3.selectAll(d.y2gp_outgoing.map(([, d]) => d.text))
        .attr("fill", "pink")
        .style("opacity", 1);
    }

    if (y1gpState == "on") {
      d3.selectAll(d.y1gp_outgoing.map((d) => d.y1gp_path))
        .style("stroke", y1gpColor)
        .raise()
        .style("opacity", 1);

      d3.select("#db_y1gpText").text(
        nodes.filter((x) => x.xid == nodeId)[0].Y1GP == "FALSE"
          ? "No funding received"
          : "Funding received"
      );
      d3.selectAll(d.y1gp_outgoing.map(([, d]) => d.text))
        .attr("fill", "#fdfd96")
        .style("opacity", 1);
    }

    d3.select("#db_name").text(nodes.filter((x) => x.xid == nodeId)[0].name);
  }

  function outed(d) {
    g.selectAll("path")
      .style("mix-blend-mode", "multiply")
      .style("opacity", 0.1);
    d3.select(d.text).style("font-weight", null);

    if (sizeState == "on") {
      d3.selectAll(d.size_outgoing.map((d) => d.size_path))
        .style("stroke", null)
        .style("stroke-width", null);
      d3.selectAll(d.size_outgoing.map(([, d]) => d.text))
        .attr("fill", null)
        .style("opacity", 1);
      d3.select("#db_sizetext").text("");
    }

    if (locState == "on") {
      d3.selectAll(d.loc_outgoing.map((d) => d.loc_path)).style("stroke", null);
      d3.selectAll(d.loc_outgoing.map(([, d]) => d.text))
        .attr("fill", null)
        .style("opacity", 1);
      d3.select("#db_locationText").text("");
    }

    if (y2gpState == "on") {
      d3.selectAll(d.y2gp_outgoing.map((d) => d.y2gp_path)).style(
        "stroke",
        null
      );
      d3.selectAll(d.y2gp_outgoing.map(([, d]) => d.text))
        .attr("fill", null)
        .style("opacity", 1);
      d3.select("#db_y2gpText").text("");
    }

    if (erfState == "on") {
      d3.selectAll(d.erf_outgoing.map((d) => d.erf_path)).style("stroke", null);
      d3.selectAll(d.erf_outgoing.map(([, d]) => d.text))
        .attr("fill", null)
        .style("opacity", 1);
      d3.select("#db_erfText").text("");
      d3.selectAll(d.erf_outgoing.map(([, d]) => d.text))
        .attr("fill", "null")
        .style("opacity", 1);
    }
    if (y1gpState == "on") {
      d3.selectAll(d.y1gp_outgoing.map((d) => d.y1gp_path)).style(
        "stroke",
        null
      );
      d3.selectAll(d.y1gp_outgoing.map(([, d]) => d.text))
        .attr("fill", null)
        .style("opacity", 1);
      d3.select("#db_y1gpText").text("");
    }
    d3.select("#db_name").text("");
  }

  // LEGEND
  // append legend svg to dashboard
  const legend = d3
    .select("#legend")
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("class", "legend");

  const dots = legend
    .append("g")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .attr("fill", "#202020")
    .selectAll("g")
    .data(groupNames)
    .join("g")
    .attr("id", function (d, i) {
      return groups[i];
    })
    .attr("transform", function (d, i) {
      return "translate(15," + 20 * (i + 1) + ")";
    })
    .on("mouseover", lMouseover)
    .on("mouseout", lMouseout);

  dots
    .append("circle")
    .attr("r", 5)
    .style("fill", function (d, i) {
      return colG[i];
    });

  dots
    .append("text")
    .attr("class", "legend")
    .text((d) => d)
    .attr("transform", "translate(8,2.5)");

  function lMouseover() {
    var group = d3.select(this).attr("id");
    d3.selectAll("g.group:not(." + group + ")").style("opacity", 0.5);
  }

  function lMouseout() {
    d3.selectAll("g.group").style("opacity", 1);
  }

  var y1gpState = "on";
  d3.select(".db_y1gp_toggle") // update location links
    .on("change", updateY1GP);

  function updateY1GP() {
    y1gpState == "on"
      ? (g.selectAll(".y1gppath").style("visibility", "hidden"),
        (y1gpState = "off"))
      : (g.selectAll(".y1gppath").style("visibility", "visible"),
        (y1gpState = "on"));
  }

  var y2gpState = "on";
  d3.select(".db_y2gp_toggle") // update location links
    .on("change", updateY2GP);

  function updateY2GP() {
    y2gpState == "on"
      ? (g.selectAll(".y2gppath").style("visibility", "hidden"),
        (y2gpState = "off"))
      : (g.selectAll(".y2gppath").style("visibility", "visible"),
        (y2gpState = "on"));
  }

  var erfState = "on";
  d3.select(".db_erf_toggle") // update location links
    .on("change", updateERF);

  function updateERF() {
    erfState == "on"
      ? (g.selectAll(".erfpath").style("visibility", "hidden"),
        (erfState = "off"))
      : (g.selectAll(".erfpath").style("visibility", "visible"),
        (erfState = "on"));
  }

  d3.select(".db_location_toggle") // update location links
    .on("change", updateLocation);

  var locState = "on";
  function updateLocation() {
    locState == "on"
      ? (g.selectAll(".locpath").style("visibility", "hidden"),
        (locState = "off"))
      : (g.selectAll(".locpath").style("visibility", "visible"),
        (locState = "on"));
  }

  d3.select(".db_size_toggle") // update size links
    .on("change", updateSize);

  var sizeState = "on";
  function updateSize() {
    sizeState == "on"
      ? (g.selectAll(".sizepath").style("visibility", "hidden"),
        (sizeState = "off"))
      : (g.selectAll(".sizepath").style("visibility", "visible"),
        (sizeState = "on"));
  }

  //   window.addEventListener("resize", setDash);
  //   setDash();
});

// window.addEventListener("resize", setDash);
// setDash();
