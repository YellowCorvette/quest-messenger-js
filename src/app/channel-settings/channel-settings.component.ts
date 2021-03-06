import { Component, OnInit } from '@angular/core';
import { QuestPubSubService } from '../services/quest-pubsub.service';
import { ConfigService } from '../services/config.service';

@Component({
  selector: 'app-channel-settings',
  templateUrl: './channel-settings.component.html',
  styleUrls: ['./channel-settings.component.scss']
})
export class ChannelSettingsComponent implements OnInit {

  constructor(private pubsub: QuestPubSubService, private config:ConfigService) { }

  challengeFlowFlag = 0;
  challengeFlowFlagChanged(value){

  }

  newInviteCodeMax = 5;
  newInviteCodeMaxChanged(event){

  }

  isOwner = false;
  generateInviteCode(){
    let channel = this.selectedChannel;
    let link;
    if(this.includeFolderStructure == 1){
      link = this.config.createInviteCode(channel,this.newInviteCodeMax, true);
    }
    else{
      link = this.config.createInviteCode(channel,this.newInviteCodeMax);
    }

    let ivC = this.pubsub.getInviteCodes(this.selectedChannel);
    this.channelInviteCodes = [];
    if(typeof ivC != 'undefined' && typeof ivC['items'] != 'undefined'){
             this.channelInviteCodes = ivC['items'];
    }
  }

  removeInviteCode(link){
    this.config.removeInviteCode(this.selectedChannel,link);
    this.channelInviteCodes = this.pubsub.getInviteCodes(this.selectedChannel)['items'];
  }

  newInviteExportFoldersChanged(value){

  }

  includeFolderStructure = 1;

  channelInviteCodes = [];

  copyToClipboard(code){
    console.log(code);
  }


  ngOnInit(): void {
    this.pubsub.selectedChannelSub.subscribe( (value) => {
      this.selectedChannel = value;
      console.log('Channel-Settings: Selected Channel: >>'+this.selectedChannel+'<<');
      console.log('Channel-Settings: noChannelSelected: >>'+this.noChannelSelected+"<<");

      if(this.selectedChannel.indexOf('-----') > -1){
        this.isOwner = this.pubsub.isOwner(this.selectedChannel);
        console.log('Channel-Settings:',this.isOwner);

        this.channelInviteCodes = [];
        let ivC = this.pubsub.getInviteCodes(this.selectedChannel);
        if(typeof ivC != 'undefined' && typeof ivC['items'] != 'undefined'){
                 this.channelInviteCodes = ivC['items'];
        }
      }
    });




  }

  selectedChannel = "NoChannelSelected";
  noChannelSelected = "NoChannelSelected";

  deleteCurrentChannel(){
    this.config.removeChannel(this.selectedChannel);
  }


}
