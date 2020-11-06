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
    var radius = width * 0.5;

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
            console.log(d);
            
        })
       
    node
        .append('circle')
        .attr('r', 3)
        .attr('class', 'node')
        .attr('id', function(d) { return d.data.name})
        //.attr('class', function(d) {return d.x < Math.PI ? "right" : "left"})
        .style('fill', function(d) { return test(d.data.group)})
        .each(function(d) { d.circle = this; })

    // node.append('rect')
    //     .attr('width', 30)
    //     .attr('height', 0.5)
    //     .style('fill', 'black')
    //     .attr('class', 'nodeLine')
    //     .attr('id', function(d) { return d.data.name})


    node.append('rect')
        .attr('width', 50)
        .attr('height', 0.5)
        //.attr('x', function(d) {  return 30 * Math.cos(Math.abs(`${d.x * 180 / Math.PI - 90}` )) })
        .style('fill', 'red')
        .attr('class', 'nodeLine2')
        .attr('id', function(d) { return d.data.name})
        .attr("transform", function(d) {return d.x < Math.PI ? 'rotate(' + (-1 * `${d.x * 180 / Math.PI - 90}`) + ')' : 'rotate(' + `${d.x * -180 / Math.PI - 90}` + ')'})
        
        
    const labels = node  	        
        .append("text")	        
        .attr("dy", "0.31em")	   
        .attr("x", d => d.x < Math.PI ? 50 : -50)	
        // .attr("y", function(d) { if (d.x < Math.PI * 0.15) {  return -2 / d.x }
        //                         else if (d.x > Math.PI * 0.92 && d.x < Math.PI) {  return 5 * d.x }
        //                         else if (d.x > Math.PI * 1.85) {  return -2 * d.x }})
                                // else { return 0 }})
        // d => d.x < (Math.PI * 1.5) && d.x > (Math.PI * 0.5) ? 30 : -30)      
        .attr('class', function(d) {return d.data.location})	  
        .attr('width', 50)
        .attr('height', 0.5)
        .style('fill', 'grey')
        .attr('class', 'nodeLine2')
        .attr('id', function(d) { return d.data.name})	        
        .text(function(d){  
                             return nodes.filter(x => x.xid == d.data.name)[0].name})	        
        .each(function(d) { 
            
            d.text = this; })
        
        .attr("text-anchor", d => d.x < Math.PI ? "start" : "end")	 
        .attr("transform", function(d) { return this.getAttribute('transform') +
                d.x < Math.PI ? 'rotate(' + (-1 * `${d.x * 180 / Math.PI - 90}`) + ')' : 'rotate(' + `${d.x * -180 / Math.PI + 90}` + ')' })
                // 'rotate(' + `${d.x * -180 / Math.PI - 90}` + ')'})	       
        // .attr("transform", function(d) {return this.getAttribute('transform') + d.x > 2.5 ? this.getAttribute('transform')  + 'translate(' + -50
        // + ',0)' :  'translate(0,10)'})


    var prev;
    labels.each(function(d, i) {
          if(i > 0) {
            var thisbb = this.getBoundingClientRect(),
                prevbb = prev.getBoundingClientRect();
                
            // position right
            if(!(thisbb.right < prevbb.left || 
                    thisbb.left > prevbb.right || 
                    thisbb.bottom < prevbb.top || 
                    thisbb.top > prevbb.bottom)) {
                
                if (d.x < 0.5 * Math.PI) {
                    d3.select(prev).attr("y", -prevbb.height / 2 / d.x)
                }
                
                else if (d.x >= Math.PI && d.x < Math.PI *1.5) {
                    d3.select(prev).attr("y", prevbb.height / d.x / (d.x-Math.PI))
                    //d3.select(this).attr("y", prevbb.bottom)   
                    
                    }
            
                
            }
            if (d.x > 0.5*Math.PI && d.x < Math.PI) {
                  
                d3.select(this).attr("y", Math.pow(d.x, 6)/ 20)
                 
                
                //d3.select(prev).attr("y", prevbb.height * 3)
                }
            
            else if (d.x > 1.5*Math.PI && d.x < 2 * Math.PI) {
                    d3.select(this).attr("y", -Math.pow((d.x-Math.PI),6)/ 25)
                     
                    
                    //d3.select(prev).attr("y", prevbb.height * 3)
                    }

            
          }
          prev = this;
        });
        
    // svg.selectAll("text")
    //     .data(root.leaves())
    //     .enter()
    //     .append("text")
    //     .attr("text-anchor", "middle")
    //     .attr("x", function(d) {
            
    //         var a = Math.abs(`${d.x * 180 / Math.PI - 90}`)
            
    //         //d.startAngle + (d.endAngle - d.startAngle)/2 - Math.PI/2;
    //         d.cx = Math.cos(a) * (radius - 75);
    //         return d.x = Math.cos(a) * (radius - 20);
    //     })
    //     .attr("y", function(d) {
    //         var a = Math.abs(`${d.x * 180 / Math.PI - 90}`)
    //         d.cy = Math.sin(a) * (radius - 75);
    //         return d.y = Math.sin(a) * (radius - 20);
    //     })
    //     .each(function(d) {
    //         var bbox = this.getBBox();
    //         d.sx = d.x - bbox.width/2 - 2;
    //         d.ox = d.x + bbox.width/2 + 2;
    //         d.sy = d.oy = d.y + 5;
    //     });



        
    var right = []
    d3.selectAll(".right").each( function(d, i){
          right.push(d3.select(this).attr("id"))
        
      })

    var left = []
      d3.selectAll(".left").each( function(d, i){
            left.push(d3.select(this).attr("id"))
        })

    left = left.reverse()

    var row = height/(left.length)
    
    var pos = []
    for (var i =0; i<left.length; i++) {
        pos.push(row * i)
    }

    
    // const labels = svg.selectAll('label')
    //     .data(nodes.filter(x => left.includes(x.xid)))
    //     .enter().append('text')
    //     .attr('class', d => 'label')
    //     .attr('id', d => d.xid)
    //     .attr('fill', '#' + Math.floor(Math.random()*16777215).toString(16))
    //     .attr('font-size', '12px')
    //     .attr('x', -width / 2)
    //     .attr('y', d => pos[left.indexOf(d.xid)] - (height / 2) + (row / 2))
    //     .text(d => d.name)
                 

    var dims = []
    d3.selectAll(".label").each( function(){
        var box =  d3.select(this).node().getBBox() 
        var id =  d3.select(this).attr('id');
        var bR = {'x': (box.x + box.width), 'y': (box.y + box.height / 2)}
        dims.push(bR)
      })
    
    var posLines = [];
    
    d3.selectAll(".nodeLine").each( function(d){
        var id =  d3.select(this).attr('id');
        var box =  d3.select(this).node().getBoundingClientRect();

        var bR = {}
        id == 'right' ? bR.x = d.x + box.x + box.width : bR.x = d.x + box.x ;
        bR.y = d.y + box.y 
        posLines.push(bR)
      })





    // svg.selectAll('nodeLine2')
    //   .data(nodes.filter(x => left.includes(x.xid)))
    //   .enter().append('line')
    //   .attr('stroke', 'blue')
    //   .attr('stroke-width', 3)
    //   .attr('x1', d => posLines[left.indexOf(d.xid)].x)// - (width / 2))
    //   .attr('x2', d => posLines[left.indexOf(d.xid)].x + 300)
    //   .attr('y1', d => posLines[left.indexOf(d.xid)].y)// - (height / 2) + (row / 2))
    //   .attr('y2', d => posLines[left.indexOf(d.xid)].y)


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
    


    function overed(d) {
        link.style("mix-blend-mode", null);
        d3.select(this).attr("font-weight", "bold");
        
        var nodeId = d3.select(this).attr('id')
        d3.selectAll('.' + nodeId + 'size').attr('stroke', 'blue').raise()
        d3.selectAll('.' + nodeId + 'loc').attr('stroke', 'red').raise()

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
        link.style("mix-blend-mode", "multiply");
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