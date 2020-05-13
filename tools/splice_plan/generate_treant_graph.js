function create_treant_node(node, parent, chart_config)
{
    var newNode = {
        HTMLclass: 'light-gray',
        text:{
            name: node.name
        },
        innerHTML: "<b>" + node.name + "</b><br>"
    }

    newNode.HTMLclass = node.name;

    var colormap = {
      totalCost: "darkred",
      outputRows: "brown",
      outputHeapSize: "blue",
      partitions: "purple"
    }


    for( let [i,j] of Object.entries(node.options) )
        { 
            newNode.text.title = newNode.text.title + ", " + i + ": " + j;
            newNode.innerHTML = newNode.innerHTML + "<p style=\"color:" + colormap[i] + "\"><b>" + i + "</b>: " + j + "</p>"
        }

    if( parent != null)
      newNode.parent = parent;
    chart_config.push(newNode)
    for( var i = 0; i<node.children.length; i++)
         create_treant_node( node.children[i], newNode, chart_config)
}

function generate_treant_graph(config, root_node)
{
  var chart_config = [
      config
  ];

  create_treant_node(root_node, null, chart_config);
  // console.log(chart_config)
  // console.log(JSON.stringify(chart_config))


   var treant = new Treant( chart_config );
   return treant;
}