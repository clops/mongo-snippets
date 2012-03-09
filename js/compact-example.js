print("---------------------------------");
print(" MongoDB Maintenance Script V0.1 ");
print("    For use in a Replica Set     ");
print("     Author: Alexey Kulikov      ");
print("---------------------------------");
print(" ")

// assuming we are a replica set ;-)
if(rs.isMaster().setName){
    try {
        //check if the script is run against a master
        if(rs.isMaster().ismaster){ //if so, step down as master        
            print("Connected to a PRIMARY node")
            print("Will try to step down as primary");
            rs.stepDown();
        
            // after stepdown connections are dropped. do an operation to cause reconnect:
            rs.isMaster();            
            
            // now ready to go.      
            // wait for another node to become primary -- it may need data from us for the last 
            // small sliver of time, and if we are already compacting it cannot get it while the 
            // compaction is running.            
            var counter = 1;
            while( 1 ) { 
                var m = rs.isMaster();
                if( m.ismaster ) {
                    print("ERROR: no one took over during our stepDown duration. we are primary again!");
                    assert(false);
                }
                
                if( m.primary ){ // someone else is, great
                    print("new master host is: "+m.primary);
                    break; 
                }
                print("waiting "+counter+" seconds");
                sleep(1000);
                counter++;
            }
        }else{
            print("Connected to a SECONDARY node");
            print("Going into Recovery Mode and Compacting");            
        }
        
        // someone else is primary, so we are ready to proceed with a compaction
        print(" ");
        print("Compacting...");
        print("- collection1");
        printjson( db.runCommand({compact:"collection1",dev:true}) );
        print("- collection2");
        printjson( db.runCommand({compact:"collection2",dev:true}) );        
        print(" ");
    
    } catch(e) { 
        print(" ");
        print("ACHTUNG! Exception:" + e);
        print(" ");
    }
}