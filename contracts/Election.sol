pragma solidity 0.4.20;

contract Election {
    // Model a Candidate
    struct Candidate {
        uint id;
        string name;
        uint voteCount;
    }

    /*struct Admin {
        string name;
    }*/
    int public numberOfVoters = 0;
    int public maxNumberOfVotes = 2;

    // Store accounts that have voted
    mapping(address => bool) public voters;
    // Store Candidates
    // Fetch Candidate
    mapping(uint => Candidate) public candidates;
    //Mapping for admins
    //mapping(uint => Admin) public admins;
    // Store Candidates Count
    uint public candidatesCount;
    // Store Admin Count
    string public admin = "0xf70fe0dea3ec3aec1bd7518ba48336c20484d0f0";

    // voted event
    event votedEvent (
        uint indexed _candidateId
    );

    function Election () public {
        // voting candidates
        addCandidate("Luka Pavcnik");
        addCandidate("Samo Pritrznik");
        addCandidate("Janez Sedeljsak");
        addCandidate("Brina Jehart");
        // admin account
        //addAdmin("0xf70fe0dea3ec3aec1bd7518ba48336c20484d0f0");
    }

    /*function addAdmin (string _id) private {
        adminsCount ++;
        admins[adminsCount] = Admin(_id);
    }*/

    function addCandidate (string _name) private {
        candidatesCount ++;
        candidates[candidatesCount] = Candidate(candidatesCount, _name, 0);
    }

    function vote (uint _candidateId) public {
        // require that they haven't voted before
        require(!voters[msg.sender]);

        // require a valid candidate
        require(_candidateId > 0 && _candidateId <= candidatesCount);

        // record that voter has voted
        voters[msg.sender] = true;

        // update candidate vote Count
        candidates[_candidateId].voteCount ++;

        numberOfVoters++;

        // trigger voted event
        votedEvent(_candidateId);
    }
}
