function create_treant_node(node, parent, chart_config)
{
    var newNode = {
        HTMLclass: 'light-gray',
        text:{
            name: node.name
        }
    }

    newNode.HTMLclass = node.name;

    var colormap = {
        totalCost: "darkred",
        outputRows: "brown",
        outputHeapSize: "blue",
        partitions: "purple"
    }

    var title = "";
    var innerHTML = "<b>" + node.name + "</b><br>"
    for( let [i,j] of Object.entries(node.options) )
    {
        title = title + ", " + i + ": " + j;
        innerHTML = innerHTML + "<p style=\"color:" + colormap[i] + "\"><b>"
                              + i + "</b>: " + j + "</p>"
    }
    newNode.text.title = title;
    newNode.innerHTML = innerHTML;

    if( parent != null)
        newNode.parent = parent;
    chart_config.push(newNode)

    // create subnodes
    for( var i = 0; i<node.children.length; i++)
        create_treant_node( node.children[i], newNode, chart_config)
}

function generate_treant_graph(config, root_node)
{
    var chart_config = [
        config
    ];

    create_treant_node(root_node, null, chart_config);

    var treant = new Treant( chart_config );
    return treant;
}