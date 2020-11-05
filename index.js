// document.getElementById('dashboard').setAttribute('style', 'width:' + window.innerWidth * 0.3)
// document.getElementById('dashboard').setAttribute('style', 'height:' + window.innerHeight)
// document.getElementById('network').setAttribute('style', 'width:' + window.innerWidth * 0.6)
// document.getElementById('dashboard').setAttribute('style', 'height:' + window.innerHeight)


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
                    temp['link_id2'] = 'x' + i + 'x' + j;
                    temp['link'] = 'link_id' + category;
                    temp['category'] = category;
                    links.push(temp); 
                }      
            }
        }
    
        // var links = Object.values(links.reduce((acc,cur)=>Object.assign(acc,{[cur.link_id]:cur}),{}))
        return links
    }

    //var links = getLinks('loc'), getLinks('Grouping'))
    var locationLinks = getLinks('loc');
    var groupLinks = getLinks('group')
    var sizeLinks = getLinks('size')

  
    var links = locationLinks.concat(sizeLinks)
    console.log(links.filter(x => x.link_id2 == 'x0x1'))
    
    // nested array
    var nest = {'name': 'ftf', 'children': []};
    // unique groups
    var groupids = groups.map(x => x.groupid)
    
    nest.children = groupids.map(x => ({
        'name': x, 
        'children': nodes.filter(y => y.group == x).map(z => ({
            'name': z.xid,
            'group': z.group,
            'category': links.filter(x => x.source == z.xid).map(x => x.category),
            'imports': links.filter(x => x.source == z.xid).map(y => y.target)
                .map(id => 'ftf.' + nodes.filter(y => y.xid == id)[0].group + '.' + id)
        }))
    }))

    
    // set random colours
    var color = [... new Set(nodes.map(x => x.loc))].map(y => ({'loc': y, 'col': '#' + Math.floor(Math.random()*16777215).toString(16)}))
    var colG = ["#fefcdc", "#f3f6f7", "#45eaf0", "#8ed253", "#a80348", "#a52a94", "#d21044"]
    var colorGroup = [... new Set(nodes.map(x => x.group))].map((y,i) => ({'group': y, 'col': colG[i]}));
    
    //console.log(colG[1])
    var test = d3.scaleOrdinal(d3.schemeSet1)
    


// {loc: "London", col: "#f14ad4"}
// 1: {loc: "Wales", col: "#14d8fd"}
// 2: {loc: "South-west", col: "#6943ee"}
// 3: {loc: "Midlands", col: "#589bcb"}
// 4: {loc: "East", col: "#ab503c"}
// 5: {loc: "South-east", col: "#2f0c5"}
// 6: {loc: "North", col: "#e2aa7d"}
    // dimensions
    var width = window.innerWidth;
    var height = window.innerHeight;
    var radius = width * 0.5;

    colornone = "#ccc"
    tree = d3.cluster()
        .size([2 * Math.PI, radius - 100])

    
    // define line, control bundle with beta
    line = d3.lineRadial()
        .curve(d3.curveBundle.beta(0.85))
        .radius(d => d.y)
        .angle(d => d.x)
    

    // function to identify id of linked components
    function id(node) {
        return `${node.parent ? id(node.parent) + "." : ""}${node.data.name}`;
      }

    // account for incoming (not defined in imports) and outgoing (imports)
    function bilink(root) {
        const map = new Map(root.leaves().map(d => [id(d), d]));
        for (const d of root.leaves()) console.log(d) ;

        for (const d of root.leaves()) d.incoming = [], d.outgoing = d.data.imports.map(i => [d, map.get(i)]);
        
        for (const d of root.leaves()) for (const o of d.outgoing) o[1].incoming.push(o);
        return root;
      }


    data = nest;

    const root = tree(bilink(d3.hierarchy(data)
      .sort((a, b) => d3.ascending(a.height, b.height) || d3.ascending(a.data.name, b.data.name))));

    //console.log(root.leaves())


    const svg = d3.select('#network').append("svg")
      .attr("viewBox", [-width  , -height, width * 2, height * 10]);

    // add nodes
    const node = svg.append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", 20)
        .attr('fill', '#202020')
        .selectAll("g")
        .data(root.leaves())
        .join("g")
        .attr("transform", d => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0)`)
        .attr('id', function(d) { return d.data.name})
        .on("mouseover", overed)
        .on("mouseout", outed)
       
    node
        .append('circle')
        .attr('r', 7)
        .attr('id', function(d) { return d.data.name})
        .attr('class', function(d) {return d.data.location})
        .style('fill', function(d) { return test(d.data.group)})
        .each(function(d) { d.circle = this; })
        
        
        
    node  
        .append("text")
        .attr("dy", "0.31em")
        .attr("x", d => d.x < Math.PI ? 6 : -6)
        .attr("text-anchor", d => d.x < Math.PI ? "start" : "end")
        .attr("transform", d => d.x >= Math.PI ? "rotate(180)" : null)
        .attr('class', function(d) {return d.data.location})
        .attr('id', function(d) { return d.data.name})
        .text(function(d){ return nodes.filter(x => x.xid == d.data.name)[0].name})
        .each(function(d) { d.text = this; })
        .each(function(d) {d.suh = 'dude'})
        

    const link = svg.append("g")
        .attr("stroke", colornone)
        .attr('fill', 'none')
        .selectAll("path")
        .data(root.leaves().flatMap(leaf => leaf.outgoing))
        .join("path")
        .style("mix-blend-mode", "multiply")
        .attr("d", ([i, o]) => line(i.path(o)))
        .attr('class', function(d) { return d[0].data.name + links.filter(x => x.link_id2 == (d[0].data.name + d[1].data.name))[0].category})
        .attr('id', function(d, i) { return d[0].data.name + d[1].data.name})
        .each(function(d) { d.path = this; });
    // var sizes = {'very small': 3, 'small': 4, 'medium': 5, 'medium/large': 5, 'large': 6}

      var circles = []
      for (var i =0; i<nodes.length; i++) {
          circles[i] = 'circle#' + nodes[i].xid
      }

      
    function overed(d) {
        link.style("mix-blend-mode", null);
        d3.select(this).attr("font-weight", "bold");
        // console.log(d.data.name)
        // console.log(d.incoming.map(d => d.path))
        // d3.selectAll(d.incoming.map(d => d.path)).attr("stroke", 'red').raise();
        // d3.selectAll(d.incoming.map(([d]) => d.text)).attr("fill", 'red').attr("font-weight", "bold");
        // d3.selectAll(d.outgoing.map(d => d.path)).attr("stroke", 'red').raise();
        // d3.selectAll(d.outgoing.map(([, d]) => d.text)).attr("fill", 'red').attr("font-weight", "bold");
        
        var test = d3.select(this).attr('id')
        console.log('.' + test + 'size')
        d3.selectAll('.' + test + 'size').attr('stroke', 'blue').raise()
        d3.selectAll('.' + test + 'loc').attr('stroke', 'red').raise()

        var current = d.outgoing.map(([, d]) => d.circle).concat(d.incoming.map(([, d]) => d.circle))
                        .concat(d.outgoing.map(([, d]) => d.text)).concat(d.incoming.map(([, d]) => d.text))
        var circles = d3.selectAll('circle, text').nodes()
        var filt = circles.filter(x => !current.includes(x))
        d3.selectAll(filt).style('opacity', 0.2) 
         
      }
      


      function outed(d) {
        link.style("mix-blend-mode", "multiply");
        d3.select(this).attr("font-weight", null);

        d3.selectAll(d.incoming.map(d => d.path)).attr("stroke", null);
        d3.selectAll(d.incoming.map(([d]) => d.text)).attr("fill", null).attr("font-weight", null);
        d3.selectAll(d.outgoing.map(d => d.path)).attr("stroke", null);
        d3.selectAll(d.outgoing.map(([, d]) => d.text)).attr("fill", null).attr("font-weight", null);

        var circles = d3.selectAll('circle, text').nodes()
        d3.selectAll(circles).style('opacity', 1)

  
      }

    })