function parse_node(m)
{
    if( m && m.length == 4)
    {
        var node = {}
        node.intend = m[1].length/2
        node.name = m[2];
        node.options = {}
        node.children = []

        var m2 = m[3].match(/(\w*)=([\w. ]*)/gm);
        if( m2 )
        {
            for (var j = 0; j < m2.length; j++) {
                var m3 = m2[j].match(/(\w*)=([^,]*)/);
                node.options[m3[1]] = m3[2]
            }
        }
        return node;
    }
    else
        return null;
}

function parse_splice_plan( text )
{
    var lines = text.split('\n');
    var m = lines[0].match(/^( *)(\S*)\((.*)\)/);

    var root_node = parse_node(m)
    var current_node = root_node;
    var stack = []


    for(var i = 1; i < lines.length;i++){
        // console.log("-------------- " + lines[i]);
        var m = lines[i].match(/^( *)->  (\S*)\((.*)\)/);
        
        var node = parse_node(m)

        if( node )
        {
            var intend = node.intend;
            while( current_node.intend+1 != intend )
                current_node = stack.pop()
            current_node.children.push( node );
            stack.push(current_node)
            current_node = node
        }
    }

    return root_node
}
