function parse_node(m)
{
    // intend -> name ( rest )
    // m[1] = intend
    // m[2] = name
    // m[3] = rest
    if( m && m.length == 4)
    {
        var node = {}
        node.intend = m[1].length/2 // splice is using 2 spaces for intend
        node.name = m[2];
        node.options = {}
        node.children = []

        // mapping rest into node.options:
        // e.g. `outputHeapSize=488.804 MB,partitions=1`
        // into node.options.outputHeapSize = "488.804 MB", node.options.partitions = "1"
        // note that we scan here for word=word until
        var m2 = m[3].match(/(\w*)=([^,]*)/gm);
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

function parse_first(text)
{
    // parse the first line without a '->', e.g.
    // Cursor(n=6,rows=2369593,updateMode=READ_ONLY (1),engine=Spark)
    // -> m[1] = ``
    // -> m[2] = Cursor
    // -> m[3] = n=6,rows=2369593,updateMode=READ_ONLY (1),engine=Spark
    var m = text.match(/^( *)(\S*)\((.*)[\)&]/);
    return parse_node(m)
}

function parse_other(text)
{
    // parseing e.g.
    // `     ->  ProjectRestrict(n=4,totalCost=59891.557,outputRows=2369593,outputHeapSize=488.804 MB,partitions=1)`
    // -> m[1] = `     `
    // -> m[2] = ProjectRestrict
    // -> m[3] = n=4,totalCost=59891.557,outputRows=2369593,outputHeapSize=488.804 MB,partitions=1
    // [\)&] because some lines don't end with ), but with &
    var m = text.match(/^( *)->  (\S*)\((.*)[\)&]/);
    return parse_node(m);
}

function parse_splice_plan( text )
{
    var lines = text.split('\n');
    // parse first line (Cursor(...))
    var parent, root_node = parse_first(lines[0])

    var stack = [root_node]

    for(var i = 1; i < lines.length;i++)
    {
        // parse other lines line (   ->  ProjectRestrict(n=4, ... )
        var node = parse_other(lines[i]);

        if( node )
        {
            // get "parent" node which has matching intend level
            do {
              parent = stack.pop()
            }
            while( parent.intend+1 != node.intend );
            // add node as children to parent
            parent.children.push( node );
            stack.push(parent)
            stack.push(node)
        }
    }

    return root_node
}
