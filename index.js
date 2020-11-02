d3.csv('./bft_data.csv').then(function(data) {
   
    var groups = [... new Set(data.map(x => x.Grouping2))].map((y,i) => ({
        'group': y,
        'groupid': 'group' + i 
     }))


    //var size = ['large', 'small']
    var nodes = data.map((x, i) => ({
        'group': groups.filter(y => y.group == x.Grouping2)[0].groupid,
        'name': x.Name2,
        'id':  i, 
        'xid': 'x' + i,
        'loc': x.Location2,
        'size': x.Scale
    }))
    

    
    
    
    function getLinks(category) {
        var matrix = [];
        var copy = nodes;
        
        for (var i=0; i<nodes.length; i++) {
            var temp = [];
            for (var j=0; j< copy.length; j++) {
                if (nodes[i][category] == copy[j][category]) {
                    temp.push(1)
                }
                else temp.push(0)
            }
        matrix.push(temp)
        }
    
        // get links from matrix
        var links = [];

        for (var i = 0; i< matrix.length; i++) {
            for (var j=0; j< matrix[i].length; j++) {
                var temp = {};
                if (matrix[i][j] == 1 && i != j) {
                    temp['source'] = 'x' + i;
                    temp['target'] = 'x' + j;
                    // temp['targetname'] = nodes.filter(x => x.id == j)[0].name
                    temp['link_id'] = i > j ? (String(j) + String(i)) : (String(i) + String(j));
                    temp['category'] = category;
                    links.push(temp); 
                }      
            }
        }
    
        var links = Object.values(links.reduce((acc,cur)=>Object.assign(acc,{[cur.link_id]:cur}),{}))
        return links
    }

    //var links = getLinks('loc'), getLinks('Grouping'))
    var locationLinks = getLinks('loc');
    var groupLinks = getLinks('group')
    var sizeLinks = getLinks('size')

    var links = sizeLinks.concat(locationLinks)
    
    
    console.log(nodes)
    // nested array
    var nest = {'name': 'ftf', 'children': []};
    // unique groups
    var groupids = groups.map(x => x.groupid)
    
    nest.children = groupids.map(x => ({
        'name': x, 
        'children': nodes.filter(y => y.group == x).map(z => ({
            // 'name': z.name,
            'name': z.xid,
            'location': z.loc,
            'imports': locationLinks.filter(x => x.source == z.xid).map(y => y.target)
                .map(id => 'ftf.' + nodes.filter(y => y.xid == id)[0].group + '.' + id)
        }))
    }))

    // set random colours
    var color = [... new Set(nodes.map(x => x.loc))].map(y => ({'loc': y, 'col': '#' + Math.floor(Math.random()*16777215).toString(16)}))


    // dimensions
    var width = window.innerWidth;
    var height = window.innerHeight;
    var radius = width / 2;
    tree = d3.cluster()
        .size([2 * Math.PI, radius - 100])

    
    // define line, control bundle with beta
    line = d3.lineRadial()
        .curve(d3.curveBundle.beta(0.85))
        .radius(d => d.y)
        .angle(d => d.x)
    

    colornone = "#ccc"
    colorout = "#f00"
    colorin = "#00f"

    // function to identify id of linked components
    function id(node) {
        return `${node.parent ? id(node.parent) + "." : ""}${node.data.name}`;
      }

    // account for incoming (not defined in imports) and outgoing (imports)
    function bilink(root) {
        const map = new Map(root.leaves().map(d => [id(d), d]));
        
        for (const d of root.leaves()) d.incoming = [], d.outgoing = d.data.imports.map(i => [d, map.get(i)]);
        for (const d of root.leaves()) for (const o of d.outgoing) o[1].incoming.push(o);
        return root;
      }


    data = nest;

    const root = tree(bilink(d3.hierarchy(data)
      .sort((a, b) => d3.ascending(a.height, b.height) || d3.ascending(a.data.name, b.data.name))));

      var test = d3.hierarchy(data)
      console.log(test.leaves())


    const svg = d3.select('body').append("svg")
      .attr("viewBox", [-width  , -height, width * 2, height * 2]);

    // add nodes
      const node = svg.append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", 20)
        .attr('stroke', '#202020')
        .selectAll("g")
        .data(root.leaves())
        .join("g")
        .attr("transform", d => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0)`)
        .append("text")
        .attr("dy", "0.31em")
        .attr("x", d => d.x < Math.PI ? 6 : -6)
        .attr("text-anchor", d => d.x < Math.PI ? "start" : "end")
        .attr("transform", d => d.x >= Math.PI ? "rotate(180)" : null)
        .text(function(d){ return nodes.filter(x => x.xid == d.data.name)[0].name})
        .each(function(d) { d.text = this; })
        .on("mouseover", overed)
        .on("mouseout", outed)
//       .call(text => text.append("title").text(d => `${id(d)}
// ${d.outgoing.length} outgoing
// ${d.incoming.length} incoming`));
    

    const link = svg.append("g")
        .attr("stroke", colornone)
        .attr("fill", "none")
        .selectAll("path")
        .data(root.leaves().flatMap(leaf => leaf.outgoing))
        .join("path")
        .style("mix-blend-mode", "multiply")
        .style('stroke', function(d) { return color.filter(x => x.loc == d[0].data.location)[0].col})//color.filter(x => x.loc == d.data.location)[0].col})
        .attr("d", ([i, o]) => line(i.path(o)))
        .each(function(d) { d.path = this; });
    // var sizes = {'very small': 3, 'small': 4, 'medium': 5, 'medium/large': 5, 'large': 6}

    function overed(d) {
        // console.log(d)
        console.log(d)
        link.style("mix-blend-mode", null);
        d3.select(this).attr('font-weight', 'bold')
            .transition().duration(500).delay(500)
        d3.selectAll(d.incoming.map(d => d.path)).attr("stroke", colorin).raise();
        d3.selectAll(d.incoming.map(([d]) => d.text)).attr("fill", colorin).attr("font-weight", "bold");
        d3.selectAll(path).attr("stroke", 'grey');

        d3.selectAll(d.outgoing.map(d => d.path)).attr("stroke", colorin).raise();
        d3.selectAll(d.outgoing.map(([, d]) => d.text)).attr("fill", colorin).attr("font-weight", "bold");
      }
    

      function outed(d) {
        // console.log(d)
        d3.select(this).attr('font-weight', 'null')

        
        link.style("mix-blend-mode", 'multiply');
        d3.selectAll(d.incoming.map(d => d.path)).attr("stroke", null);
        d3.selectAll(d.incoming.map(([d]) => d.text)).attr("fill", null).attr("font-weight", null);
        d3.selectAll(d.outgoing.map(d => d.path)).attr("stroke", null);
        d3.selectAll(d.outgoing.map(([, d]) => d.text)).attr("fill", null).attr("font-weight", null);
  
      }

    })