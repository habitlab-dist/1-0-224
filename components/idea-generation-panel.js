(function(){
  var prelude, $, swal, post_json, load_css_file, ref$, get_enabled_goals, get_goals, set_goal_target, get_goal_target, remove_custom_goal_and_generated_interventions, add_enable_custom_goal_reduce_time_on_domain, set_goal_enabled_manual, set_goal_disabled_manual, get_interventions, get_enabled_interventions, set_intervention_disabled, unique, enable_interventions_because_goal_was_enabled, get_baseline_time_on_domains, list_all_domains_in_history, add_log_interventions, url_to_domain, get_canonical_domain, get_favicon_data_for_domain_cached, promise_all_object, msg, polymer_ext;
  prelude = require('prelude-ls');
  $ = require('jquery');
  swal = require('sweetalert2');
  post_json = require('libs_backend/ajax_utils').post_json;
  load_css_file = require('libs_common/content_script_utils').load_css_file;
  ref$ = require('libs_backend/goal_utils'), get_enabled_goals = ref$.get_enabled_goals, get_goals = ref$.get_goals, set_goal_target = ref$.set_goal_target, get_goal_target = ref$.get_goal_target, remove_custom_goal_and_generated_interventions = ref$.remove_custom_goal_and_generated_interventions, add_enable_custom_goal_reduce_time_on_domain = ref$.add_enable_custom_goal_reduce_time_on_domain, set_goal_enabled_manual = ref$.set_goal_enabled_manual, set_goal_disabled_manual = ref$.set_goal_disabled_manual;
  ref$ = require('libs_backend/intervention_utils'), get_interventions = ref$.get_interventions, get_enabled_interventions = ref$.get_enabled_interventions, set_intervention_disabled = ref$.set_intervention_disabled;
  unique = require('libs_common/array_utils').unique;
  enable_interventions_because_goal_was_enabled = require('libs_backend/intervention_manager').enable_interventions_because_goal_was_enabled;
  ref$ = require('libs_backend/history_utils'), get_baseline_time_on_domains = ref$.get_baseline_time_on_domains, list_all_domains_in_history = ref$.list_all_domains_in_history;
  add_log_interventions = require('libs_backend/log_utils').add_log_interventions;
  url_to_domain = require('libs_common/domain_utils').url_to_domain;
  get_canonical_domain = require('libs_backend/canonical_url_utils').get_canonical_domain;
  get_favicon_data_for_domain_cached = require('libs_backend/favicon_utils').get_favicon_data_for_domain_cached;
  promise_all_object = require('libs_common/promise_utils').promise_all_object;
  msg = require('libs_common/localization_utils').msg;
  polymer_ext = require('libs_frontend/polymer_utils').polymer_ext;
  polymer_ext({
    is: 'idea-generation-panel',
    properties: {
      index_background_color: {
        type: String,
        value: 'rgb(81, 167,249)'
      },
      sites_list: {
        type: Array
      },
      site_ideas_mapping: {
        type: Array,
        value: []
      },
      site_ideas_mapping_counter: {
        type: Array,
        value: []
      },
      current_site: {
        type: String,
        value: ''
      },
      current_left_idea_id: {
        type: String,
        value: ''
      },
      current_right_idea_id: {
        type: String,
        value: ''
      }
    },
    inject_site_ideas_mapping: async function(site_list){
      var logging_server_url, ideas_placeholder, i$, len$, site, lresult$, j$, len1$, idea, site_idea_pair, data, upload_successful, response, e, results$ = [];
      if (site_list == null) {
        site_list = this.site_list;
      }
      if (localStorage.getItem('local_logging_server') === 'true') {
        console.log("posting to local server");
        logging_server_url = 'http://localhost:5000/';
      } else {
        console.log("posting to cloud server");
        logging_server_url = 'https://habitlab.herokuapp.com/';
      }
      ideas_placeholder = ['placeholder_1', 'placeholder_2', 'placeholder_3', 'placeholder_4', 'placeholder_5', 'placeholder_6'];
      for (i$ = 0, len$ = site_list.length; i$ < len$; ++i$) {
        site = site_list[i$];
        lresult$ = [];
        for (j$ = 0, len1$ = ideas_placeholder.length; j$ < len1$; ++j$) {
          idea = ideas_placeholder[j$];
          site_idea_pair = {
            site: site,
            idea: idea,
            vote: 0
          };
          console.log(site_idea_pair);
          data = import$({}, site_idea_pair);
          upload_successful = true;
          try {
            console.log('Posting data to: ' + logging_server_url + 'postideas');
            response = (await post_json(logging_server_url + 'postideas', data));
            if (response.success) {
              lresult$.push(console.log('success'));
            } else {
              upload_successful = false;
              dlog('response from server was not successful in postideas');
              dlog(response);
              dlog(data);
              lresult$.push(console.log('response from server was not successful in postideas'));
            }
          } catch (e$) {
            e = e$;
            upload_successful = false;
            dlog('error thrown in postideas');
            dlog(e);
            dlog(data);
            lresult$.push(console.log('error thrown in postideas'));
          }
        }
        results$.push(lresult$);
      }
      return results$;
    },
    upvote_idea: async function(option){
      var self, upvote_idea, logging_server_url, request, data, this$ = this;
      self = this;
      upvote_idea = '';
      if (option === 'right') {
        upvote_idea = self.current_right_idea_id;
      } else {
        upvote_idea = self.current_left_idea_id;
      }
      console.log("Upvoting website: " + self.current_site + " for idea: " + upvote_idea + ".");
      if (localStorage.getItem('local_logging_server') === 'true') {
        console.log("posting to local server");
        logging_server_url = 'http://localhost:5000/';
      } else {
        console.log("posting to cloud server");
        logging_server_url = 'https://habitlab.herokuapp.com/';
      }
      request = logging_server_url + 'upvote_proposed_idea' + '?idea_id=' + upvote_idea;
      data = (await fetch(request).then(function(it){
        return it.json();
      }));
      return console.log(data);
    },
    select_answer_leftside: async function(evt){
      var self;
      self = this;
      if (this.animation_inprogress) {
        return;
      }
      (await self.upvote_idea('left'));
      this.SM('.animate_left').css("filter", "grayscale(0%)");
      this.SM('.animate_left').css("background-color", "#0000FF");
      this.$$('.animate_left').innerText = this.$$('.fix_left').innerText;
      this.SM('.answer-leftside-animate').css("margin-top", '0');
      this.SM('.answer-leftside-animate').css("z-index", '1');
      this.SM('.answer-leftside-fix').css("z-index", '0');
      this.SM('.answer-leftside-animate').animate({
        marginTop: '+120px'
      }, 1000);
      this.SM('.animate_right').css("background-color", "#0000FF");
      this.SM('.animate_right').css("filter", "grayscale(30%)");
      this.$$('.animate_right').innerText = this.$$('.fix_right').innerText;
      this.SM('.answer-rightside-animate').css("margin-top", '0');
      this.SM('.answer-rightside-animate').css("z-index", '1');
      this.SM('.answer-rightside-fix').css("z-index", '0');
      this.SM('.answer-rightside-animate').animate({
        marginTop: '+120px'
      }, 1000);
      (await self.display_idea());
      this.animation_inprogress = true;
      return setTimeout(function(){
        return self.animation_inprogress = false;
      }, 1000);
    },
    select_answer_rightside: async function(evt){
      var self;
      self = this;
      if (this.animation_inprogress) {
        return;
      }
      (await self.upvote_idea('right'));
      this.SM('.animate_right').css("filter", "grayscale(0%)");
      this.SM('.animate_right').css("background-color", "#0000FF");
      this.$$('.animate_right').innerText = this.$$('.fix_right').innerText;
      this.SM('.answer-rightside-animate').css("margin-top", '0');
      this.SM('.answer-rightside-animate').css("z-index", '1');
      this.SM('.answer-rightside-fix').css("z-index", '0');
      this.SM('.answer-rightside-animate').animate({
        marginTop: '+120px'
      }, 1000);
      this.SM('.animate_left').css("background-color", "#0000FF");
      this.SM('.animate_left').css("filter", "grayscale(30%)");
      this.$$('.animate_left').innerText = this.$$('.fix_left').innerText;
      this.SM('.answer-leftside-animate').css("margin-top", '0');
      this.SM('.answer-leftside-animate').css("z-index", '1');
      this.SM('.answer-leftside-fix').css("z-index", '0');
      this.SM('.answer-leftside-animate').animate({
        marginTop: '+120px'
      }, 1000);
      (await self.display_idea());
      this.animation_inprogress = true;
      return setTimeout(function(){
        return self.animation_inprogress = false;
      }, 1000);
    },
    select_opt_out: async function(evt){
      var self;
      self = this;
      if (this.animation_inprogress) {
        return;
      }
      this.SM('.animate_right').css("filter", "grayscale(30%)");
      this.SM('.animate_right').css("background-color", "#0000FF");
      this.$$('.animate_right').innerText = this.$$('.fix_right').innerText;
      this.SM('.answer-rightside-animate').css("margin-top", '0');
      this.SM('.answer-rightside-animate').css("z-index", '1');
      this.SM('.answer-rightside-fix').css("z-index", '0');
      this.SM('.answer-rightside-animate').animate({
        marginTop: '+120px'
      }, 1000);
      this.SM('.animate_left').css("filter", "grayscale(30%)");
      this.SM('.animate_left').css("background-color", "#0000FF");
      this.$$('.animate_left').innerText = this.$$('.fix_left').innerText;
      this.SM('.answer-leftside-animate').css("margin-top", '0');
      this.SM('.answer-leftside-animate').css("z-index", '1');
      this.SM('.answer-leftside-fix').css("z-index", '0');
      this.SM('.answer-leftside-animate').animate({
        marginTop: '+120px'
      }, 1000);
      (await self.display_idea());
      this.animation_inprogress = true;
      return setTimeout(function(){
        return self.animation_inprogress = false;
      }, 1000);
    },
    user_typing_idea: function(evt){
      return this.idea_text = this.$$('#nudge_typing_area').value;
    },
    add_own_idea: function(){
      this.$$('#add_idea_dialog').open();
      if (this.idea_text != null && this.idea_text.length > 0) {
        return this.$$('#nudge_typing_area').value = this.idea_text;
      }
    },
    submit_idea: async function(){
      var idea_site, idea_text, logging_server_url, site_idea_pair, data, upload_successful, response, e;
      idea_site = this.$$('#idea_site_selector').selected;
      idea_site = this.sites_list[idea_site];
      idea_text = this.$$('#nudge_typing_area').value;
      this.$$('#nudge_typing_area').value = '';
      this.idea_text = '';
      if (localStorage.getItem('local_logging_server') === 'true') {
        console.log("posting to local server");
        logging_server_url = 'http://localhost:5000/';
      } else {
        console.log("posting to cloud server");
        logging_server_url = 'https://habitlab.herokuapp.com/';
      }
      site_idea_pair = {
        site: idea_site,
        idea: idea_text
      };
      console.log(site_idea_pair);
      data = import$({}, site_idea_pair);
      console.log(data);
      upload_successful = true;
      try {
        console.log('Posting data to: ' + logging_server_url + 'postidea_candidate');
        response = (await post_json(logging_server_url + 'postidea_candidate', data));
        if (response.success) {
          console.log('success');
        } else {
          upload_successful = false;
          dlog('response from server was not successful in postidea_candidate');
          dlog(response);
          dlog(data);
          console.log('response from server was not successful in postidea_candidate');
        }
      } catch (e$) {
        e = e$;
        upload_successful = false;
        dlog('error thrown in postidea_candidate');
        dlog(e);
        dlog(data);
        console.log('error thrown in postidea_candidate');
      }
      return this.$$('#add_idea_dialog').close();
    },
    display_idea: async function(){
      var self, i$, ref$, len$, site_ideas_pair, j$, ref1$, len1$, site_counter_pair, index;
      self = this;
      for (i$ = 0, len$ = (ref$ = self.site_ideas_mapping).length; i$ < len$; ++i$) {
        site_ideas_pair = ref$[i$];
        for (j$ = 0, len1$ = (ref1$ = self.site_ideas_mapping_counter).length; j$ < len1$; ++j$) {
          site_counter_pair = ref1$[j$];
          if (site_ideas_pair.site === site_counter_pair.site) {
            if (site_counter_pair.counter < site_ideas_pair.ideas.length / 2) {
              self.$$('.vote-question').innerText = msg("Which do you think would be a better nudge for " + site_ideas_pair.site + " ?");
              self.current_site = site_ideas_pair.site;
              index = site_counter_pair.counter * 2;
              if (site_counter_pair.counter === Math.floor(site_ideas_pair.ideas.length / 2)) {
                self.$$('.fix_left').innerText = msg(site_ideas_pair.ideas[index]);
                self.$$('.fix_right').innerText = msg(site_ideas_pair.ideas[0]);
                self.current_left_idea_id = site_ideas_pair.ideas_id[index];
                self.current_right_idea_id = site_ideas_pair.ideas_id[0];
              } else {
                self.$$('.fix_left').innerText = msg(site_ideas_pair.ideas[index]);
                self.$$('.fix_right').innerText = msg(site_ideas_pair.ideas[index + 1]);
                self.current_left_idea_id = site_ideas_pair.ideas_id[index];
                self.current_right_idea_id = site_ideas_pair.ideas_id[index + 1];
              }
              site_counter_pair.counter = site_counter_pair.counter + 1;
              return;
            }
          }
        }
      }
      document.getElementById("disable_left").disabled = true;
      document.getElementById("disable_right").disabled = true;
      return document.getElementById("disable_opt_out").disabled = true;
    },
    ready: async function(){
      var self, all_goals, goal_info_list, sites_list, enabled_goals, enabled_goals_keys, enabled_spend_less_site, i$, len$, item, logging_server_url, site, site_upper, request, data, idea_temp, idea_id_temp, j$, len1$, this$ = this;
      self = this;
      all_goals = (await get_goals());
      goal_info_list = Object.values(all_goals);
      sites_list = goal_info_list.map(function(it){
        return it.sitename_printable;
      });
      sites_list = sites_list.filter(function(it){
        return it != null;
      });
      sites_list = unique(sites_list);
      sites_list.sort();
      this.sites_list = sites_list;
      enabled_goals = (await get_enabled_goals());
      enabled_goals_keys = Object.keys(enabled_goals);
      enabled_spend_less_site = [];
      for (i$ = 0, len$ = enabled_goals_keys.length; i$ < len$; ++i$) {
        item = enabled_goals_keys[i$];
        enabled_spend_less_site.push(item.split("/")[0]);
      }
      console.log(enabled_spend_less_site);
      if (localStorage.getItem('local_logging_server') === 'true') {
        console.log("posting to local server");
        logging_server_url = 'http://localhost:5000/';
      } else {
        console.log("posting to cloud server");
        logging_server_url = 'https://habitlab.herokuapp.com/';
      }
      for (i$ = 0, len$ = enabled_spend_less_site.length; i$ < len$; ++i$) {
        site = enabled_spend_less_site[i$];
        site_upper = site.charAt(0).toUpperCase() + site.slice(1);
        request = logging_server_url + 'getideas_vote' + '?website=' + site_upper;
        console.log("Fetching from the server of shared interventions from: " + site_upper);
        data = (await fetch(request).then(fn$));
        idea_temp = [];
        idea_id_temp = [];
        for (j$ = 0, len1$ = data.length; j$ < len1$; ++j$) {
          item = data[j$];
          idea_temp.push(item.idea);
          idea_id_temp.push(item._id);
        }
        self.site_ideas_mapping.push({
          site: site,
          ideas: idea_temp,
          ideas_id: idea_id_temp
        });
        self.site_ideas_mapping_counter.push({
          site: site,
          counter: 0
        });
      }
      return (await self.display_idea());
      function fn$(it){
        return it.json();
      }
    }
  }, [
    {
      source: require('libs_common/localization_utils'),
      methods: ['msg']
    }, {
      source: require('libs_frontend/polymer_methods'),
      methods: ['text_if', 'once_available', 'S', 'SM']
    }, {
      source: require('libs_frontend/polymer_methods_resize'),
      methods: ['on_resize']
    }
  ]);
  function import$(obj, src){
    var own = {}.hasOwnProperty;
    for (var key in src) if (own.call(src, key)) obj[key] = src[key];
    return obj;
  }
}).call(this);
