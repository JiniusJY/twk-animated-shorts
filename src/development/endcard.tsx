import React from 'react';
import {Composition,registerRoot} from 'remotion';
import {EndCard} from '../engine/EndCard';
registerRoot(()=> <Composition id="endcard" component={()=> <EndCard start={0} handle="@techwhoknows"/>} durationInFrames={120} fps={30} width={1080} height={1920}/>);
