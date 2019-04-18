//const Chart = require('chart.js')

App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  hasVoted: false,

  init: function () {
    return App.initWeb3();
  },

  initWeb3: function () {
    // TODO: refactor conditional
    if (typeof web3 !== 'undefined') {
      // If a web3 instance is already provided by Meta Mask.
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      web3 = new Web3(App.web3Provider);
    }
    return App.initContract();
  },

  initContract: function () {
    $.getJSON("Election.json", function (election) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.Election = TruffleContract(election);
      // Connect provider to interact with contract
      App.contracts.Election.setProvider(App.web3Provider);

      App.listenForEvents();

      return App.render();
    });
  },

  // Listen for events emitted from the contract
  listenForEvents: function () {
    App.contracts.Election.deployed().then(function (instance) {
      // Restart Chrome if you are unable to receive this event
      // This is a known issue with Metamask
      // https://github.com/MetaMask/metamask-extension/issues/2393
      instance.votedEvent({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function (error, event) {
        //console.log("event triggered", event)
        // Reload when a new vote is recorded
        App.render();
      });
    });
  },

  render: async function () {
    var globalAdmin = null;
    var _numberOfVoters = 0;
    var _maxVoters = null;
    var isAdmin = false;
    var electionInstance;

    // get number of people voted already
    await App.contracts.Election.deployed().then(function (instance) {
      electionInstance = instance;
      return electionInstance.maxNumberOfVotes();
    }).then(function (maxNumberOfVotes) {
      _maxVoters = maxNumberOfVotes.c[0]
    });

    await App.contracts.Election.deployed().then(function (instance) {
      electionInstance = instance;
      return electionInstance.numberOfVoters();
    }).then(function (numberOfVoters) {
      _numberOfVoters = numberOfVoters.c[0]
    });

    // deploy admin
    await App.contracts.Election.deployed().then(function (instance) {
      console.log("in admin func");
      electionInstance = instance;
      return electionInstance.admin();
    }).then(function (admin) {
      globalAdmin = admin;
    });

    // load account data
    await web3.eth.getCoinbase(function (err, account) {
      if (err === null) {
        console.log(account);
        App.account = account;
        $("#accountAddress").html("Your Account: <b>" + account + "</b>");
        if (account == globalAdmin) {
          isAdmin = true;
          $("#accountAddress").append(" (<b>Admin</b>)");
        } else {
          $("#accountAddress").append(" (<b>User</b>)");
        }
      }
    });

    // Load contract data
    App.contracts.Election.deployed().then(function (instance) {
      electionInstance = instance;
      return electionInstance.candidatesCount();
    }).then(function (candidatesCount) {
      var candidatesResults = $("#candidatesResults");

      var candidatesSelect = $('#candidatesSelect');
      candidatesSelect.empty();

      candidatesResults.children().remove();

      for (var i = 1; i <= candidatesCount; i++) {
        electionInstance.candidates(i).then(function (candidate) {
          if (Number(document.getElementById('candidatesResults').rows.length || "0") < Number(candidatesCount)) {
            var id = candidate[0];
            var name = candidate[1];
            var voteCount = candidate[2];

            // Render candidate Result
            var candidateTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td class=\"count\">" + voteCount + "</td></tr>"
            candidatesResults.append(candidateTemplate);

            // Render candidate ballot option
            var candidateOption = "<option value='" + id + "' >" + name + "</ option>"
            candidatesSelect.append(candidateOption);
          }
        });
      }

      return electionInstance.voters(App.account);
    }).then(function (hasVoted) {
      if (isAdmin) {
        if (_numberOfVoters == _maxVoters) {
          $('form').html(`
            <div>
              <h2>Vote count: ${_numberOfVoters}/${_maxVoters}</h2>
              <h1>-Voting has finished</h1>
            </div>
          `);
        } else {
          $('form').html(`
            <div>
              <h2>Vote count: ${_numberOfVoters}/${_maxVoters}</h2>
              <h1>-Voting in progress</h1>
            </div>
          `);
        }
        $("#cadidates_tbl").show();
      }
      // Do not allow a user to vote
      if (hasVoted) {
        $('form').html("<h1>-Thank you for voting</h1>");
      }


      /*var ctx = document.getElementById("pie_chart").getContext('2d');
      var myChart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: ["Green", "Blue", "Gray", "Purple", "Yellow", "Red", "Black"],
          datasets: [{
            backgroundColor: [
              "#2ecc71",
              "#3498db",
              "#95a5a6",
              "#9b59b6",
              "#f1c40f",
              "#e74c3c",
              "#34495e"
            ],
            data: [12, 19, 3, 17, 28, 24, 7]
          }]
        }
      });*/

      $("body").fadeIn(300);
    }).catch(function (error) {
      console.warn(error);
    });
  },

  castVote: function () {
    var candidateId = $('#candidatesSelect').val();
    App.contracts.Election.deployed().then(function (instance) {
      return instance.vote(candidateId, { from: App.account });
    }).then(function (result) {
      console.log("voted");
    }).catch(function (err) {
      console.error(err);
    });
  }
};

$(function () {
  $(window).load(function () {
    App.init();
  });
});
