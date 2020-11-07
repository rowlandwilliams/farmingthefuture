//import fs from 'fs';


document.getElementById('dashboard').setAttribute('style', 'height:' + window.innerHeight + 'px')
document.getElementById('network').setAttribute('style', 'height:' + window.innerHeight + 'px')

var link = './nested.json'
//var link = './bft_data.csv'


d3.json(link).then(function(data) {
   
    
    var nodes = data.nodes
    var links = data.links
    var nest = data.nest
    

    // set random colours
    var color = [... new Set(nodes.map(x => x.loc))].map(y => ({'loc': y, 'col': '#' + Math.floor(Math.random()*16777215).toString(16)}))
    var colG = ["#fefcdc", "#f3f6f7", "#45eaf0", "#8ed253", "#a80348", "#a52a94", "#d21044"]
    var colorGroup = [... new Set(nodes.map(x => x.group))].map((y,i) => ({'group': y, 'col': colG[i]}));
    
    //console.log(colG[1])
    var test = d3.scaleOrdinal(d3.schemeSet1)
    
     
    var width = document.getElementById('network').offsetWidth;
    var height = document.getElementById('network').offsetHeight;
    var radius = Math.min(width, height) * 0.7

    colornone = "#ccc"
    tree = d3.cluster()
        .size([2 * Math.PI, radius - 200])

    
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
        for (const d of root.leaves()) d.incoming = [], d.outgoing = d.data.imports.map(i => [d, map.get(i)]);
        for (const d of root.leaves()) for (const o of d.outgoing) o[1].incoming.push(o);
        return root;
      }


    const root = tree(bilink(d3.hierarchy(nest)
      .sort((a, b) => d3.ascending(a.height, b.height) || d3.ascending(a.data.name, b.data.name))));


    const svg = d3.select('#network').append("svg")
      .attr("viewBox", [-width / 2  , -height / 2, width , height ]);


    // add nodes
    
    const node = svg.append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .attr('fill', '#202020')
        .selectAll("g")
        .data(root.leaves())
        .join("g")
        .attr("transform", d => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0)`)
        .attr('class', function(d) {return d.x < Math.PI ? "right" : "left"})
        .attr('id', function(d) { return d.data.name})
        .on("mouseover", overed)
        .on("mouseout", outed)
        .each(function(d) {
            // calculate angle from respective 0
            d.angle = d.x * 180 / Math.PI - 90
            
            
        })
       
    node
        .append('circle')
        .attr('r', 3)
        .attr('class', 'node')
        .attr('id', function(d) { return d.data.name})
        //.attr('class', function(d) {return d.x < Math.PI ? "right" : "left"})
        .style('fill', function(d) { return test(d.data.group)})
        .each(function(d) { d.circle = this; })

   


    node.append('rect')
        .attr('width', 30)
        .attr('height', 0.5)
        //.attr('x', function(d) {  return 30 * Math.cos(Math.abs(`${d.x * 180 / Math.PI - 90}` )) })
        .style('fill', 'grey')
        .attr('class', 'nodeLine2')
        .attr('id', function(d) { return d.data.name})
        
        
       var pos2 = []; 
    const labels = node  	        
        .append("text")	        
        .attr("dy", "0.31em")	   
        .attr("x", d => d.x < Math.PI ? 30 : -30)		    
        .attr('class', 'label')	  
        .style('fill', 'grey')
        .attr('id', function(d) { return  'lab' + d.data.name})	        
        .text(function(d){  return nodes.filter(x => x.xid == d.data.name)[0].name})	        
        .each(function(d) { d.text = this; })
        .attr("text-anchor", d => d.x < Math.PI ? "start" : "end") 
        .attr("transform", function(d) { return this.getAttribute('transform') + // rotate back to horizontal
                d.x < Math.PI ? 'rotate(' + (-1 * `${d.x * 180 / Math.PI - 90}`) + ')' : 'rotate(' + `${d.x * -180 / Math.PI + 90}` + ')' })
        .each(function(d) {
            var temp = []    
            var bbox = this.getBBox();
            console.log(bbox)
                d.bL = bbox.x 
                d.bR = d.x + bbox.x + bbox.width
                d.bY = bbox.y + d.y
                temp.push(d.bL)
                temp.push(d.bR)
                temp.push(d.bY)
                
                
                pos2.push(temp)
        });
   
console.log(pos2)
    
        
        
    
    
    
    



    

    var prev;
    labels.each(function(d, i) {
          if(i > 0) {
            var thisbb = this.getBoundingClientRect(),
                prevbb = prev.getBoundingClientRect();
              
            // position overlapping
            if(!(thisbb.right < prevbb.left || 
                    thisbb.left > prevbb.right || 
                    thisbb.bottom < prevbb.top || 
                    thisbb.top > prevbb.bottom)) {
                 
            }
            // posiition each quadrant separately
            if (d.x > 0.5*Math.PI && d.x <= Math.PI) {  // 2nd quad
                d3.select(this).attr("y", Math.pow(d.x, 6)/ 20 + thisbb.height)
                }
            
            else if (d.x <= 0.5 * Math.PI) { // 1st quad
                    d3.select(prev).attr("y", -prevbb.height / 2 / d.x - thisbb.height)
                }

            else if (d.x >= 1.5*Math.PI && d.x < 2 * Math.PI) {  // 4th quad
                    d3.select(this).attr("y", -Math.pow((d.x-Math.PI),6)/ 25 - thisbb.height)
                    }
            
            else if (d.x >= Math.PI && d.x < Math.PI *1.5) { // 3rd quad
                        d3.select(this).attr("y", thisbb.height / d.x / (d.x-Math.PI) + thisbb.height)
                        }

          }
          prev = this;
        });
        


    // d3.selectAll('.label'){}
        
    const link = svg.append("g")
        .attr("stroke", colornone)
        .attr('fill', 'none')
        .selectAll("path")
        .data(root.leaves().flatMap(leaf => leaf.outgoing))
        .join("path")
        .style("mix-blend-mode", "multiply")
        .style('opacity', 0.4)
        .attr("d", ([i, o]) => line(i.path(o)))
        .attr('class', function(d) { return d[0].data.name + links.filter(x => x.link_id2 == (d[0].data.name + d[1].data.name))[0].category})
        .attr('id', function(d, i) { return d[0].data.name + d[1].data.name})
        .each(function(d) { d.path = this; });
    


    function overed(d) {
        link.style("mix-blend-mode", null)
        d3.select(this).attr("font-weight", "bold");
        
        var nodeId = d3.select(this).attr('id')
        d3.selectAll('.' + nodeId + 'size').attr('stroke', '#ff8fc1').raise().style('opacity', 1)
        d3.selectAll('.' + nodeId + 'loc').attr('stroke', '#77DD77').raise().style('opacity', 1)

        d3.select('#db_name').text(nodes.filter(x => x.xid == nodeId)[0].name)
        d3.select('#db_sizetext').text(nodes.filter(x => x.xid == nodeId)[0].size)
        d3.select('#db_sizelocation').text(nodes.filter(x => x.xid == nodeId)[0].loc)

        var current = d.outgoing.map(([, d]) => d.circle).concat(d.incoming.map(([, d]) => d.circle))
                        .concat(d.outgoing.map(([, d]) => d.text)).concat(d.incoming.map(([, d]) => d.text))
        var circles = d3.selectAll('circle, text').nodes()
        var filt = circles.filter(x => !current.includes(x))
        d3.selectAll(filt).style('opacity', 0.2) 
         
      }
      


      function outed(d) {
        link.style("mix-blend-mode", "multiply").style('opacity', 0.4)
        d3.select(this).attr("font-weight", null);

        d3.selectAll(d.incoming.map(d => d.path)).attr("stroke", null);
        d3.selectAll(d.incoming.map(([d]) => d.text)).attr("fill", null).attr("font-weight", null);
        d3.selectAll(d.outgoing.map(d => d.path)).attr("stroke", null);
        d3.selectAll(d.outgoing.map(([, d]) => d.text)).attr("fill", null).attr("font-weight", null);

        var circles = d3.selectAll('circle, text').nodes()
        d3.selectAll(circles).style('opacity', 1)

        d3.select('#db_name').text('')
        d3.select('#db_sizetext').text('')
        d3.select('#db_sizelocation').text('')
      }

    })