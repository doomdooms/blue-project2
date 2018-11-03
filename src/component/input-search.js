import React from 'react';
import PropTypes from 'prop-types';
import deburr from 'lodash/deburr';
import Autosuggest from 'react-autosuggest';
import match from 'autosuggest-highlight/match';
import parse from 'autosuggest-highlight/parse';
import TextField from '@material-ui/core/TextField';
import Paper from '@material-ui/core/Paper';
import MenuItem from '@material-ui/core/MenuItem';
import { withStyles } from '@material-ui/core/styles';
import InputAdornment from '@material-ui/core/InputAdornment';
import Search from '@material-ui/icons/Search'
import { IconButton } from '@material-ui/core';
import { connect } from 'react-redux';
import { updateActivity, get_playlists } from '../actions/actionCreator';
import { bindActionCreators } from 'redux';
import * as fromPlaylists from '../reducers/getPlaylist';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

function renderInputComponent(inputProps) {
  const { data, classes, inputRef = () => { }, ref, ...other } = inputProps;
  const playlists = data.playlists;
  return (
    <TextField
      fullWidth
      InputProps={{
        inputRef: node => {
          ref(node);
          inputRef(node);
        },
        endAdornment: (
          <InputAdornment position="start">
            <IconButton classes={{
              root: classes.btn
            }}><Search /></IconButton>

          </InputAdornment>
        ),
        classes: {
          input: classes.input,
          underline: classes.whiteUnderline
        },
        data: { playlists },
      }}
      {...other}
    />
  );
}

function renderSuggestion(suggestion, { query, isHighlighted }) {
  const matches = match(suggestion.activity, query);
  const parts = parse(suggestion.activity, matches);

  return (
    <MenuItem selected={isHighlighted} component="div">
      <div>
        {parts.map((part, index) => {
          return part.highlight ? (
            <span key={String(index)} style={{ fontWeight: 500 }}>
              {part.text}
            </span>
          ) : (
              <strong key={String(index)} style={{ fontWeight: 300 }}>
                {part.text}
              </strong>
            );
        })}
      </div>
    </MenuItem>
  );
}

function getSuggestions(value, playlists) {

  const inputValue = deburr(value.trim()).toLowerCase();
  const inputLength = inputValue.length;
  let count = 0;

  return inputLength === 0
    ? []
    : playlists.filter(playlist => {

      const keep =
        count < 5 && playlist.activity.slice(0, inputLength).toLowerCase() === inputValue;

      if (keep) {
        count += 1;
      }

      return keep;
    });
}

function getSuggestionValue(suggestion) {

  return suggestion.activity;
}

const styles = theme => ({
  root: {
    height: 250,
    flexGrow: 1,
    color: 'white',
  },
  btn: {
    flexGrow: 1,
    color: 'white',
  },
  container: {
    position: 'relative',
  },
  suggestionsContainerOpen: {
    position: 'absolute',
    zIndex: 1,
    marginTop: theme.spacing.unit,
    left: 0,
    right: 0,
  },
  suggestion: {
    display: 'block',
  },
  suggestionsList: {
    margin: 0,
    padding: 0,
    listStyleType: 'none',
  },
  divider: {
    height: theme.spacing.unit * 2,
  },
  input: {
    color: 'rgba(256, 256, 256, 0.9)',
    //borderBottom: '1px solid rgba(256, 256, 256, 0.42)',
    fontSize: 20,
  },
  whiteUnderline: {
    '&:before': {
      borderBottom: '1px solid rgba(256, 256, 256, 0.42)',
    },
    '&:hover': {
      borderBottom: '1px solid rgba(256, 256, 256, 0.42)',
    },
    '&:after': {
      borderBottom: '2px solid rgba(256, 256, 256, 0.9)',
    },
  }
});

class IntegrationAutosuggest extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      single: '',
      suggestions: [],
    }
  }


  handleSuggestionsFetchRequested = (playlists) => ({ value }) => {

    this.setState({ suggestions: getSuggestions(value, playlists) });
  };

  handleSuggestionsClearRequested = () => {
    this.setState({
      suggestions: [],
    });
  };
  handleKeyDown = (name) => (event) => {
    this.props.updateActivity(this.state.single);
  }
  handleChange = (name) => (event, { newValue }) => {
    this.setState({
      [name]: newValue,
    });

  };

  render() {
    const { classes, data } = this.props;
    const playlists = data.playlists;
    const autosuggestProps = {
      renderInputComponent,
      suggestions: this.state.suggestions,
      onSuggestionsFetchRequested: this.handleSuggestionsFetchRequested(playlists),
      onSuggestionsClearRequested: this.handleSuggestionsClearRequested,
      handleKeyDown: this.handleKeyDown,
      getSuggestionValue,
      renderSuggestion,
    };
    return (

      <div className={classes.root}>
        <Autosuggest
          {...autosuggestProps}
          inputProps={{
            data,
            classes,
            placeholder: 'Insert your activity here!',
            value: this.state.single,
            onChange: this.handleChange('single'),
            onKeyDown: this.handleKeyDown('single'),
          }}
          theme={{
            container: classes.container,
            suggestionsContainerOpen: classes.suggestionsContainerOpen,
            suggestionsList: classes.suggestionsList,
            suggestion: classes.suggestion,
          }}
          renderSuggestionsContainer={options => (
            <Paper {...options.containerProps} square>
              {options.children}
            </Paper>
          )}
        />

      </div>
    );
  }
}

IntegrationAutosuggest.propTypes = {
  classes: PropTypes.object.isRequired,
};

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({
    updateActivity
  }, dispatch)
}
export default withStyles(styles)(connect(null, mapDispatchToProps)(graphql(gql`
query {
    playlists{
      id,
      activity,
      activity_src
    }
  }
`)(IntegrationAutosuggest)));
